/**
 * Student Performance Sampling Comparison
 * Sampling and Dataset Engine (sampling.js)
 */

class DatasetEngine {
    constructor() {
        this.population = [];
        this.features = [
            'studyHours',
            'attendance',
            'sleepHours',
            'assignmentScores',
            'internalMarks',
            'internetUsage',
            'participation'
        ];
    }

    /**
     * Generates a realistically distributed synthetic dataset.
     * N = population size.
     */
    generatePopulation(N = 1000, passRate = 50) {
        this.population = [];
        
        for (let i = 0; i < N; i++) {
            // 1. Internet Usage (binary: 0 or 1, ~75% yes)
            const internetUsage = Math.random() < 0.75 ? 1 : 0;

            // 2. Study Hours: normally distributed around 6 hours, dependent slightly on internet usage (less study if internet heavy)
            let studyHours = this.randomNormal(6.2 - (internetUsage * 0.5), 2.2);
            studyHours = Math.max(1, Math.min(12, Math.round(studyHours * 10) / 10));

            // 3. Attendance: normally distributed around 80%, capped at 100%, lower limit 50%
            let attendance = this.randomNormal(81 + (studyHours * 1.2), 11);
            attendance = Math.max(50, Math.min(100, Math.round(attendance)));

            // 4. Sleep Hours: normally distributed around 7 hours, negatively correlated with study hours and internet usage
            let sleepHours = this.randomNormal(7.4 - (studyHours * 0.15) - (internetUsage * 0.4), 1.2);
            sleepHours = Math.max(4, Math.min(10, Math.round(sleepHours * 10) / 10));

            // 5. Assignment Scores: strongly correlated with study hours and attendance
            let assignmentBase = (studyHours / 12) * 50 + (attendance / 100) * 40 + Math.random() * 10;
            let assignmentScores = this.randomNormal(assignmentBase, 6);
            assignmentScores = Math.max(0, Math.min(100, Math.round(assignmentScores)));

            // 6. Internal Marks: strongly correlated with assignments and attendance
            let internalBase = (assignmentScores * 0.7) + ((attendance - 50) / 50 * 20) + Math.random() * 10;
            let internalMarks = this.randomNormal(internalBase, 5);
            internalMarks = Math.max(0, Math.min(100, Math.round(internalMarks)));

            // 7. Participation: 1 to 5 scale, higher attendance correlates with more participation
            let participationBase = 1 + (attendance / 100) * 3 + Math.random() * 1;
            let participation = Math.max(1, Math.min(5, Math.round(participationBase)));

            this.population.push({
                id: i + 1,
                studyHours,
                attendance,
                sleepHours,
                assignmentScores,
                internalMarks,
                internetUsage,
                participation,
                target: 0 // Will be assigned dynamically below
            });
        }

        // Dynamically assign targets based on utility scores and baseline pass rate
        this.assignTargetsBasedOnPassRate(this.population, passRate);
        
        return this.population;
    }

    /**
     * Assigns targets dynamically to the population to match a specific pass rate.
     * passRate = percentage between 10 and 90.
     */
    assignTargetsBasedOnPassRate(population, passRate) {
        const N = population.length;
        if (N === 0) return;

        // Compute utility scores for all students
        const itemsWithUtility = population.map((item, idx) => {
            const internetUsage = item.internetUsage;
            const attendance = item.attendance;
            const studyHours = item.studyHours;
            const assignmentScores = item.assignmentScores;
            const internalMarks = item.internalMarks;
            const sleepHours = item.sleepHours;
            const participation = item.participation;

            // Calculate utility using coefficients
            const utility = (attendance * 0.35) + 
                            (studyHours * 2.8) + 
                            (assignmentScores * 0.22) + 
                            (internalMarks * 0.18) + 
                            (sleepHours * 0.8) + 
                            (participation * 1.5) - 
                            (internetUsage * 1.5);
            
            // Add some standard noise
            const noise = this.randomNormal(0, 4);
            const score = utility + noise;

            return {
                originalIdx: idx,
                score: score
            };
        });

        // Sort items by utility score descending
        itemsWithUtility.sort((a, b) => b.score - a.score);

        // Determine cutoff count
        const passCount = Math.round(N * (passRate / 100));

        // Assign targets
        for (let i = 0; i < N; i++) {
            const originalIndex = itemsWithUtility[i].originalIdx;
            population[originalIndex].target = (i < passCount) ? 1 : 0;
        }
    }

    /**
     * Box-Muller transform for normal distribution
     */
    randomNormal(mean, stdDev) {
        let u = 0, v = 0;
        while(u === 0) u = Math.random(); 
        while(v === 0) v = Math.random();
        let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
        return num * stdDev + mean;
    }

    /**
     * Simple Random Sampling Without Replacement (SRSWOR)
     */
    sampleSRSWOR(sampleSize) {
        if (sampleSize > this.population.length) {
            throw new Error("Sample size cannot be larger than the population size.");
        }
        
        const sample = [];
        const indices = new Set();
        
        while (indices.size < sampleSize) {
            const idx = Math.floor(Math.random() * this.population.length);
            if (!indices.has(idx)) {
                indices.add(idx);
                sample.push({ ...this.population[idx] });
            }
        }
        return sample;
    }

    /**
     * Stratified Sampling based on Target (Pass/Fail)
     */
    sampleStratified(sampleSize) {
        if (sampleSize > this.population.length) {
            throw new Error("Sample size cannot be larger than the population size.");
        }

        // Segregate population into strata based on target
        const strata = {
            0: [], // Fail
            1: []  // Pass
        };

        for (const student of this.population) {
            strata[student.target].push(student);
        }

        const nTotal = this.population.length;
        const nFail = strata[0].length;
        const nPass = strata[1].length;

        // Calculate stratum weights
        const weightFail = nFail / nTotal;
        const weightPass = nPass / nTotal;

        // Calculate sample sizes per stratum (rounded to nearest integer)
        let sampleSizeFail = Math.round(sampleSize * weightFail);
        let sampleSizePass = Math.round(sampleSize * weightPass);

        // Adjust for rounding errors to match total sampleSize exactly
        const diff = sampleSize - (sampleSizeFail + sampleSizePass);
        if (diff !== 0) {
            if (strata[1].length >= strata[0].length) {
                sampleSizePass += diff;
            } else {
                sampleSizeFail += diff;
            }
        }

        // Check if sample sizes exceed strata capacities
        if (sampleSizeFail > nFail || sampleSizePass > nPass) {
            // Fallback: Cap at maximum capacity and redistribute if possible
            if (sampleSizeFail > nFail) {
                const overflow = sampleSizeFail - nFail;
                sampleSizeFail = nFail;
                sampleSizePass = Math.min(nPass, sampleSizePass + overflow);
            } else {
                const overflow = sampleSizePass - nPass;
                sampleSizePass = nPass;
                sampleSizeFail = Math.min(nFail, sampleSizeFail + overflow);
            }
        }

        // Draw SRSWOR samples from each stratum
        const sampleFail = this.drawRandomSubsample(strata[0], sampleSizeFail);
        const samplePass = this.drawRandomSubsample(strata[1], sampleSizePass);

        // Combine and shuffle
        const finalSample = [...sampleFail, ...samplePass];
        return this.shuffle(finalSample);
    }

    /**
     * Helper to draw random items from a specific array (stratum) without replacement
     */
    drawRandomSubsample(arr, size) {
        const sample = [];
        const indices = new Set();
        const n = arr.length;
        
        while (indices.size < size && indices.size < n) {
            const idx = Math.floor(Math.random() * n);
            if (!indices.has(idx)) {
                indices.add(idx);
                sample.push({ ...arr[idx] });
            }
        }
        return sample;
    }

    /**
     * Shuffles an array in place
     */
    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    /**
     * Gets summary statistics of any dataset (population or sample)
     */
    getStats(dataset) {
        if (!dataset || dataset.length === 0) return null;
        
        const count = dataset.length;
        let passCount = 0;
        let sumStudy = 0;
        let sumAttendance = 0;
        let sumSleep = 0;
        let sumAssignments = 0;
        let sumInternal = 0;
        let sumParticipation = 0;
        let sumInternet = 0;

        for (const item of dataset) {
            if (item.target === 1) passCount++;
            sumStudy += item.studyHours;
            sumAttendance += item.attendance;
            sumSleep += item.sleepHours;
            sumAssignments += item.assignmentScores;
            sumInternal += item.internalMarks;
            sumParticipation += item.participation;
            sumInternet += item.internetUsage;
        }

        return {
            count,
            passCount,
            failCount: count - passCount,
            passRate: Math.round((passCount / count) * 1000) / 10,
            avgStudy: Math.round((sumStudy / count) * 100) / 100,
            avgAttendance: Math.round((sumAttendance / count) * 100) / 100,
            avgSleep: Math.round((sumSleep / count) * 100) / 100,
            avgAssignments: Math.round((sumAssignments / count) * 100) / 100,
            avgInternal: Math.round((sumInternal / count) * 100) / 100,
            avgParticipation: Math.round((sumParticipation / count) * 100) / 100,
            avgInternet: Math.round((sumInternet / count) * 1000) / 10
        };
    }
}

// Export for browser
window.DatasetEngine = DatasetEngine;
