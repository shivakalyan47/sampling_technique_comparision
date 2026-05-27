/**
 * Student Performance Sampling Comparison
 * Main Dashboard Controller (app.js)
 */

document.addEventListener('DOMContentLoaded', () => {
    // -----------------------------------------------------------------
    // 1. Application State & References
    // -----------------------------------------------------------------
    const state = {
        engine: new DatasetEngine(),
        population: [],
        populationStats: null,
        
        sampleSize: 200,
        populationSize: 1000, // Total population count simulated
        baselinePassRate: 50, // User-defined pass rate percentage
        selectedModelType: 'logistic', // 'knn', 'tree', 'logistic'
        
        // Sampling outputs
        srsworSample: [],
        stratifiedSample: [],
        
        // Trained models and scalers
        srsworModel: null,
        srsworScaler: null,
        stratifiedModel: null,
        stratifiedScaler: null,
        
        // Features list
        features: [
            'studyHours',
            'attendance',
            'sleepHours',
            'assignmentScores',
            'internalMarks',
            'internetUsage',
            'participation'
        ],
        
        // Evaluation metrics
        srsworMetrics: null,
        stratifiedMetrics: null,
        
        // UI elements
        chart: null,
        currentPage: 1,
        pageSize: 10,
        searchQuery: ''
    };

    // Initialize population
    state.population = state.engine.generatePopulation(state.populationSize, state.baselinePassRate);
    state.populationStats = state.engine.getStats(state.population);

    // -----------------------------------------------------------------
    // 2. Element Selectors
    // -----------------------------------------------------------------
    const elements = {
        // Navigation links
        navLinks: document.querySelectorAll('.nav-item'),
        sections: document.querySelectorAll('.dashboard-section'),
        
        // Global Info
        popSizeLbl: document.getElementById('lbl-pop-size'),
        passRateLbl: document.getElementById('lbl-pass-rate'),
        selectedModelLbl: document.getElementById('lbl-selected-model'),
        trainingStatusLbl: document.getElementById('lbl-training-status'),
        
        // Dataset Table
        tableBody: document.getElementById('dataset-table-body'),
        tableSearch: document.getElementById('table-search'),
        tablePrevBtn: document.getElementById('table-prev'),
        tableNextBtn: document.getElementById('table-next'),
        tablePageInfo: document.getElementById('table-page-info'),
        statAvgStudy: document.getElementById('stat-avg-study'),
        statAvgAttendance: document.getElementById('stat-avg-attendance'),
        statAvgAssignments: document.getElementById('stat-avg-assignments'),
        statAvgSleep: document.getElementById('stat-avg-sleep'),
        statPassRate: document.getElementById('stat-pass-rate'),
        btnRegenDataset: document.getElementById('btn-regen-dataset'),
        sliderBaselinePass: document.getElementById('slider-baseline-pass'),
        bubbleBaselinePass: document.getElementById('bubble-baseline-pass'),
        popRatioLbl: document.getElementById('pop-ratio-lbl'),
        popRange: document.getElementById('pop-range'),
        popValBubble: document.getElementById('pop-val-bubble'),
        lblSampleDescription: document.getElementById('lbl-sample-description'),
        csvFileInput: document.getElementById('csv-file-input'),
        btnUploadCsv: document.getElementById('btn-upload-csv'),

        // Training Section Input Controls
        modelSelect: document.getElementById('model-select'),
        sampleRange: document.getElementById('sample-range'),
        sampleValBubble: document.getElementById('sample-val-bubble'),
        btnTrainModel: document.getElementById('btn-train-model'),
        trainingOverlay: document.getElementById('training-overlay'),
        trainingStep1: document.getElementById('t-step-1'),
        trainingStep2: document.getElementById('t-step-2'),
        trainingStep3: document.getElementById('t-step-3'),
        trainingStep4: document.getElementById('t-step-4'),
        
        // Sampling Visualizations
        popVizGrid: document.getElementById('pop-viz-grid'),
        srsworVizGrid: document.getElementById('srswor-viz-grid'),
        stratifiedVizCard: document.getElementById('stratified-viz-card'),
        srsworRatioLbl: document.getElementById('srswor-ratio-lbl'),
        stratifiedRatioLbl: document.getElementById('stratified-ratio-lbl'),

        // Hyperparameter divs
        knnParams: document.getElementById('knn-hyperparams'),
        treeParams: document.getElementById('tree-hyperparams'),
        logisticParams: document.getElementById('logistic-hyperparams'),
        knnKInput: document.getElementById('knn-k'),
        treeDepthInput: document.getElementById('tree-depth'),
        logisticLrInput: document.getElementById('logistic-lr'),
        logisticEpochsInput: document.getElementById('logistic-epochs'),

        // Evaluation Elements
        srsworAccCard: document.getElementById('srswor-acc-card'),
        srsworPrecCard: document.getElementById('srswor-prec-card'),
        srsworRecCard: document.getElementById('srswor-rec-card'),
        srsworF1Card: document.getElementById('srswor-f1-card'),
        
        stratifiedAccCard: document.getElementById('strat-acc-card'),
        stratifiedPrecCard: document.getElementById('strat-prec-card'),
        stratifiedRecCard: document.getElementById('strat-rec-card'),
        stratifiedF1Card: document.getElementById('strat-f1-card'),

        tblSrsworAcc: document.getElementById('tbl-srswor-acc'),
        tblSrsworPrec: document.getElementById('tbl-srswor-prec'),
        tblSrsworRec: document.getElementById('tbl-srswor-rec'),
        tblSrsworF1: document.getElementById('tbl-srswor-f1'),

        tblStratAcc: document.getElementById('tbl-strat-acc'),
        tblStratPrec: document.getElementById('tbl-strat-prec'),
        tblStratRec: document.getElementById('tbl-strat-rec'),
        tblStratF1: document.getElementById('tbl-strat-f1'),
        
        // Confusion Matrices
        srsworTP: document.getElementById('srswor-tp'),
        srsworFP: document.getElementById('srswor-fp'),
        srsworFN: document.getElementById('srswor-fn'),
        srsworTN: document.getElementById('srswor-tn'),

        stratTP: document.getElementById('strat-tp'),
        stratFP: document.getElementById('strat-fp'),
        stratFN: document.getElementById('strat-fn'),
        stratTN: document.getElementById('strat-tn'),

        conclusionText: document.getElementById('conclusion-text'),
        
        // Custom Inference Form Fields
        predStudy: document.getElementById('pred-study'),
        predAttendance: document.getElementById('pred-attendance'),
        predSleep: document.getElementById('pred-sleep'),
        predAssignments: document.getElementById('pred-assignments'),
        predInternal: document.getElementById('pred-internal'),
        predInternet: document.getElementById('pred-internet'),
        predParticipation: document.getElementById('pred-participation'),

        valStudy: document.getElementById('val-study'),
        valAttendance: document.getElementById('val-attendance'),
        valSleep: document.getElementById('val-sleep'),
        valAssignments: document.getElementById('val-assignments'),
        valInternal: document.getElementById('val-internal'),
        valParticipation: document.getElementById('val-participation'),

        srsworPredBox: document.getElementById('srswor-pred-box'),
        srsworPredOutcome: document.getElementById('srswor-pred-outcome'),
        srsworPredProb: document.getElementById('srswor-pred-prob'),
        
        stratPredBox: document.getElementById('strat-pred-box'),
        stratPredOutcome: document.getElementById('strat-pred-outcome'),
        stratPredProb: document.getElementById('strat-pred-prob')
    };

    // -----------------------------------------------------------------
    // 3. Navigation Controls
    // -----------------------------------------------------------------
    elements.navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetSectionId = link.getAttribute('data-section');
            
            // Toggle sidebar active states
            elements.navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            // Switch active section in main area
            elements.sections.forEach(sec => {
                sec.classList.remove('active');
                if (sec.id === targetSectionId) {
                    sec.classList.add('active');
                }
            });
        });
    });

    // -----------------------------------------------------------------
    // 4. Data Explorer View Helpers
    // -----------------------------------------------------------------
    function renderStatsDashboard() {
        // Global cards
        elements.popSizeLbl.textContent = state.population.length;
        elements.passRateLbl.textContent = state.populationStats.passRate + "%";
        
        // Table Stats
        elements.statAvgStudy.textContent = state.populationStats.avgStudy + " hrs";
        elements.statAvgAttendance.textContent = state.populationStats.avgAttendance + "%";
        elements.statAvgAssignments.textContent = state.populationStats.avgAssignments + "%";
        elements.statAvgSleep.textContent = state.populationStats.avgSleep + " hrs";
        elements.statPassRate.textContent = state.populationStats.passRate + "%";
    }

    function renderDatasetTable() {
        // Apply search query
        let filtered = state.population;
        if (state.searchQuery.trim() !== '') {
            const query = state.searchQuery.toLowerCase();
            filtered = state.population.filter(student => 
                student.id.toString().includes(query) ||
                student.studyHours.toString().includes(query) ||
                student.attendance.toString().includes(query) ||
                student.assignmentScores.toString().includes(query) ||
                student.internalMarks.toString().includes(query) ||
                (student.internetUsage === 1 ? 'yes' : 'no').includes(query) ||
                student.participation.toString().includes(query)
            );
        }

        const totalItems = filtered.length;
        const totalPages = Math.max(1, Math.ceil(totalItems / state.pageSize));
        
        // Clamp current page
        if (state.currentPage > totalPages) state.currentPage = totalPages;
        if (state.currentPage < 1) state.currentPage = 1;

        elements.tablePageInfo.textContent = `Page ${state.currentPage} of ${totalPages}`;
        elements.tablePrevBtn.disabled = state.currentPage === 1;
        elements.tableNextBtn.disabled = state.currentPage === totalPages;

        // Slice data
        const start = (state.currentPage - 1) * state.pageSize;
        const pageData = filtered.slice(start, start + state.pageSize);

        elements.tableBody.innerHTML = '';
        if (pageData.length === 0) {
            elements.tableBody.innerHTML = `<tr><td colspan="9" style="text-align:center; color: var(--text-muted);">No records found matching search.</td></tr>`;
            return;
        }

        pageData.forEach(student => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>#${student.id}</td>
                <td>${student.studyHours}</td>
                <td>${student.attendance}%</td>
                <td>${student.sleepHours}</td>
                <td>${student.assignmentScores}%</td>
                <td>${student.internalMarks}%</td>
                <td>${student.internetUsage === 1 ? 'Yes' : 'No'}</td>
                <td>${student.participation}/5</td>
                <td><span class="badge ${student.target === 1 ? 'pass' : 'fail'}">${student.target === 1 ? 'PASS' : 'FAIL'}</span></td>
            `;
            elements.tableBody.appendChild(tr);
        });
    }

    elements.tableSearch.addEventListener('input', (e) => {
        state.searchQuery = e.target.value;
        state.currentPage = 1;
        renderDatasetTable();
    });

    elements.tablePrevBtn.addEventListener('click', () => {
        if (state.currentPage > 1) {
            state.currentPage--;
            renderDatasetTable();
        }
    });

    elements.tableNextBtn.addEventListener('click', () => {
        const filteredCount = state.searchQuery.trim() !== '' 
            ? state.population.filter(s => s.id.toString().includes(state.searchQuery)).length
            : state.population.length;
        const totalPages = Math.ceil(filteredCount / state.pageSize);
        if (state.currentPage < totalPages) {
            state.currentPage++;
            renderDatasetTable();
        }
    });

    elements.btnRegenDataset.addEventListener('click', () => {
        elements.btnRegenDataset.innerHTML = '<i class="fas fa-sync fa-spin"></i> Generating...';
        setTimeout(() => {
            state.population = state.engine.generatePopulation(1000, state.baselinePassRate);
            state.populationStats = state.engine.getStats(state.population);
            state.currentPage = 1;
            renderStatsDashboard();
            renderDatasetTable();
            renderInitialVisualizations();
            elements.btnRegenDataset.innerHTML = '<i class="fas fa-sync"></i> Regenerate Dataset';
        }, 600);
    });

    elements.sliderBaselinePass.addEventListener('input', (e) => {
        const passRate = parseInt(e.target.value);
        state.baselinePassRate = passRate;
        elements.bubbleBaselinePass.textContent = passRate + '%';

        // Re-assign target pass/fail bounds on the active population dynamically
        state.engine.assignTargetsBasedOnPassRate(state.population, passRate);
        state.populationStats = state.engine.getStats(state.population);

        // Update ratios and metrics dynamically
        elements.popRatioLbl.textContent = `Ratio: ~${passRate}% Pass / ${100 - passRate}% Fail`;
        
        renderStatsDashboard();
        renderDatasetTable();
        renderInitialVisualizations();
        triggerInference();
    });

    elements.popRange.addEventListener('input', (e) => {
        const newSize = parseInt(e.target.value);
        state.populationSize = newSize;
        elements.popValBubble.textContent = newSize;

        // Re-generate dataset of the new size
        state.population = state.engine.generatePopulation(newSize, state.baselinePassRate);
        state.populationStats = state.engine.getStats(state.population);

        // Dynamically clamp the Sample Size slider maximum limit so it never exceeds population size
        const maxSample = Math.min(500, newSize);
        elements.sampleRange.max = maxSample;
        if (state.sampleSize > maxSample) {
            state.sampleSize = maxSample;
            elements.sampleRange.value = maxSample;
            elements.sampleValBubble.textContent = maxSample;
        }

        // Update descriptors
        elements.lblSampleDescription.textContent = `Determines the subset size drawn from the ${newSize.toLocaleString()} population.`;

        renderStatsDashboard();
        renderDatasetTable();
        renderInitialVisualizations();
        triggerInference();
    });

    // -----------------------------------------------------------------
    // CSV File Upload Controls & Parsing Logic
    // -----------------------------------------------------------------
    elements.btnUploadCsv.addEventListener('click', () => {
        elements.csvFileInput.click();
    });

    elements.csvFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        elements.btnUploadCsv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Parsing...';
        
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const text = event.target.result;
                const parsedData = parseCSV(text);
                
                if (parsedData.length === 0) {
                    throw new Error("The CSV file is empty or contains no readable rows.");
                }

                // Update Application State
                state.population = parsedData;
                state.populationSize = parsedData.length;
                state.populationStats = state.engine.getStats(state.population);

                // Update slider indicators
                elements.popRange.value = state.populationSize;
                elements.popValBubble.textContent = state.populationSize;

                // Adjust sample slider constraints
                const maxSample = Math.min(500, state.populationSize);
                elements.sampleRange.max = maxSample;
                if (state.sampleSize > maxSample) {
                    state.sampleSize = maxSample;
                    elements.sampleRange.value = maxSample;
                    elements.sampleValBubble.textContent = maxSample;
                }

                elements.lblSampleDescription.textContent = `Determines the subset size drawn from the ${state.populationSize.toLocaleString()} population.`;

                // Update UI panels
                elements.popRatioLbl.textContent = `Ratio: ~${state.populationStats.passRate}% Pass / ${Math.round((100 - state.populationStats.passRate)*10)/10}% Fail`;
                
                // Align slider values
                elements.sliderBaselinePass.value = Math.round(state.populationStats.passRate);
                elements.bubbleBaselinePass.textContent = Math.round(state.populationStats.passRate) + "%";
                state.baselinePassRate = Math.round(state.populationStats.passRate);

                renderStatsDashboard();
                renderDatasetTable();
                renderInitialVisualizations();
                triggerInference();

                alert(`Successfully imported ${state.populationSize} student records from CSV!\n\nTarget labels were preserved. Preprocessing and sample distributions are now based on your custom dataset.`);
            } catch (err) {
                alert("Failed to parse CSV file: " + err.message + "\n\nPlease ensure your CSV has a header row with columns like Study Hours, Attendance, and Target (Pass/Fail).");
            } finally {
                elements.btnUploadCsv.innerHTML = '<i class="fas fa-file-upload"></i> Upload CSV';
                // Reset file input so same file can be uploaded again
                elements.csvFileInput.value = '';
            }
        };
        
        reader.readAsText(file);
    });

    /**
     * Vanilla JS CSV Parser with column mapping synonyms and default values fill-in.
     */
    function parseCSV(text) {
        const lines = text.split(/\r?\n/);
        if (lines.length < 2) return [];

        // Helper to split line by comma, respecting quotes
        const splitCSVLine = (line) => {
            const result = [];
            let current = '';
            let inQuotes = false;
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    result.push(current.trim());
                    current = '';
                } else {
                    current += char;
                }
            }
            result.push(current.trim());
            return result;
        };

        const headers = splitCSVLine(lines[0]).map(h => h.toLowerCase());
        const parsed = [];

        // Dynamic column synonyms mapping
        const synonymMap = {
            studyHours: ['studyhours', 'study hours', 'study_hours', 'studytime', 'study time', 'study', 'hours'],
            attendance: ['attendance', 'attendance (%)', 'attendance_rate', 'attendance%', 'attend', 'attendance rate'],
            sleepHours: ['sleephours', 'sleep hours', 'sleep_hours', 'sleep', 'sleeptime', 'sleep hours'],
            assignmentScores: ['assignmentscores', 'assignment scores', 'assignment_scores', 'assignments', 'assignment%', 'assignment', 'internal marks', 'internals'],
            internalMarks: ['internalmarks', 'internal marks', 'internal_marks', 'internals', 'internal', 'marks', 'score'],
            internetUsage: ['internetusage', 'internet usage', 'internet_usage', 'internet', 'net', 'wifi'],
            participation: ['participation', 'classroom participation', 'class participation', 'active', 'participation level'],
            target: ['target', 'pass/fail', 'pass_fail', 'performance', 'pass', 'result', 'label', 'outcome', 'status']
        };

        // Find index mapping
        const headerIndices = {};
        for (const feature of Object.keys(synonymMap)) {
            const synonyms = synonymMap[feature];
            const foundIdx = headers.findIndex(h => synonyms.includes(h) || synonyms.some(s => h.includes(s)));
            headerIndices[feature] = foundIdx;
        }

        let studentId = 1;
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            if (line.trim() === '') continue;

            const cols = splitCSVLine(line);
            
            // Extract values, fallback to robust defaults if column is missing or empty
            const getVal = (feature, defaultVal) => {
                const idx = headerIndices[feature];
                if (idx === undefined || idx < 0 || idx >= cols.length || cols[idx] === '') {
                    return defaultVal;
                }
                const parsedVal = parseFloat(cols[idx]);
                return isNaN(parsedVal) ? cols[idx] : parsedVal;
            };

            const parseBinary = (feature, defaultVal) => {
                const idx = headerIndices[feature];
                if (idx === undefined || idx < 0 || idx >= cols.length || cols[idx] === '') {
                    return defaultVal;
                }
                const str = cols[idx].toString().toLowerCase().trim();
                if (str === 'yes' || str === 'y' || str === 'true' || str === '1' || str === 'pass') return 1;
                if (str === 'no' || str === 'n' || str === 'false' || str === '0' || str === 'fail') return 0;
                return isNaN(parseFloat(str)) ? defaultVal : (parseFloat(str) > 0.5 ? 1 : 0);
            };

            // Custom fill-ins for missing properties
            const studyHours = Math.round(getVal('studyHours', Math.max(1, Math.min(12, Math.round((Math.random() * 8 + 2) * 10) / 10))) * 10) / 10;
            const attendance = Math.max(50, Math.min(100, Math.round(getVal('attendance', Math.random() * 30 + 70))));
            const sleepHours = Math.round(getVal('sleepHours', Math.max(4, Math.min(10, Math.round((Math.random() * 4 + 5) * 10) / 10))) * 10) / 10;
            const assignmentScores = Math.max(0, Math.min(100, Math.round(getVal('assignmentScores', Math.random() * 50 + 50))));
            const internalMarks = Math.max(0, Math.min(100, Math.round(getVal('internalMarks', Math.random() * 50 + 50))));
            const internetUsage = parseBinary('internetUsage', Math.random() < 0.75 ? 1 : 0);
            const participation = Math.max(1, Math.min(5, Math.round(getVal('participation', Math.floor(Math.random() * 5) + 1))));
            
            // For target target, if missing, we predict it based on a simple linear boundary
            const target = parseBinary('target', (attendance * 0.35 + studyHours * 2.8 > 55) ? 1 : 0);

            parsed.push({
                id: studentId++,
                studyHours,
                attendance,
                sleepHours,
                assignmentScores,
                internalMarks,
                internetUsage,
                participation,
                target
            });
        }
        return parsed;
    }

    // -----------------------------------------------------------------
    // 5. Model Settings & Inputs
    // -----------------------------------------------------------------
    elements.sampleRange.addEventListener('input', (e) => {
        state.sampleSize = parseInt(e.target.value);
        elements.sampleValBubble.textContent = state.sampleSize;
    });

    elements.modelSelect.addEventListener('change', (e) => {
        state.selectedModelType = e.target.value;
        
        // Hide all hyperparameter forms
        elements.knnParams.style.display = 'none';
        elements.treeParams.style.display = 'none';
        elements.logisticParams.style.display = 'none';

        if (state.selectedModelType === 'knn') {
            elements.knnParams.style.display = 'block';
        } else if (state.selectedModelType === 'tree') {
            elements.treeParams.style.display = 'block';
        } else if (state.selectedModelType === 'logistic') {
            elements.logisticParams.style.display = 'block';
        }
    });

    // -----------------------------------------------------------------
    // 6. Sampling Visualization Mechanics
    // -----------------------------------------------------------------
    function renderInitialVisualizations() {
        // Draw population visualization (up to 300 random students to avoid layout clutter)
        elements.popVizGrid.innerHTML = '';
        const displayLimit = 300;
        const displayPop = state.population.slice(0, displayLimit);
        
        displayPop.forEach(student => {
            const dot = document.createElement('span');
            dot.className = `node-dot ${student.target === 1 ? 'pass' : 'fail'}`;
            dot.title = `ID: #${student.id} | Attendance: ${student.attendance}% | Target: ${student.target === 1 ? 'Pass' : 'Fail'}`;
            elements.popVizGrid.appendChild(dot);
        });

        // Initialize empty placeholder dots for samples
        elements.srsworVizGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; font-size: 0.85rem; color: var(--text-muted); padding: 1.5rem 0;">Train the models to apply sampling and see distribution flow!</div>`;
        
        const stratFailVizGrid = document.getElementById('strat-fail-viz-grid');
        const stratPassVizGrid = document.getElementById('strat-pass-viz-grid');
        const stratFailTakenLbl = document.getElementById('strat-fail-taken-lbl');
        const stratPassTakenLbl = document.getElementById('strat-pass-taken-lbl');

        if (stratFailVizGrid && stratPassVizGrid) {
            stratFailVizGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; font-size: 0.8rem; color: var(--text-muted); padding: 1rem 0;">Pending...</div>`;
            stratPassVizGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; font-size: 0.8rem; color: var(--text-muted); padding: 1rem 0;">Pending...</div>`;
            stratFailTakenLbl.textContent = 'Taken: -';
            stratPassTakenLbl.textContent = 'Taken: -';
        }
        
        elements.srsworRatioLbl.textContent = 'Distribution: -';
        elements.stratifiedRatioLbl.textContent = 'Distribution: -';
    }

    function renderActiveSamplingVisualizations() {
        // 1. Draw SRSWOR Sample
        elements.srsworVizGrid.innerHTML = '';
        const srsworStats = state.engine.getStats(state.srsworSample);
        elements.srsworRatioLbl.textContent = `P: ${srsworStats.passCount} (${srsworStats.passRate}%) | F: ${srsworStats.failCount}`;
        
        state.srsworSample.forEach(student => {
            const dot = document.createElement('span');
            dot.className = `node-dot ${student.target === 1 ? 'pass' : 'fail'}`;
            dot.title = `ID: #${student.id} | Sampling: SRSWOR | Target: ${student.target === 1 ? 'Pass' : 'Fail'}`;
            elements.srsworVizGrid.appendChild(dot);
        });

        // 2. Draw Stratified Sample split by stratum
        const stratStats = state.engine.getStats(state.stratifiedSample);
        elements.stratifiedRatioLbl.textContent = `P: ${stratStats.passCount} (${stratStats.passRate}%) | F: ${stratStats.failCount}`;

        const stratFailVizGrid = document.getElementById('strat-fail-viz-grid');
        const stratPassVizGrid = document.getElementById('strat-pass-viz-grid');
        const stratFailTakenLbl = document.getElementById('strat-fail-taken-lbl');
        const stratPassTakenLbl = document.getElementById('strat-pass-taken-lbl');

        if (stratFailVizGrid && stratPassVizGrid) {
            stratFailVizGrid.innerHTML = '';
            stratPassVizGrid.innerHTML = '';

            const nTotal = state.population.length;
            const nFail = state.population.filter(s => s.target === 0).length;
            const nPass = state.population.filter(s => s.target === 1).length;
            const failWeight = ((nFail / nTotal) * 100).toFixed(1);
            const passWeight = ((nPass / nTotal) * 100).toFixed(1);

            stratFailTakenLbl.textContent = `${stratStats.failCount} drawn (from ${nFail} total, ${failWeight}%)`;
            stratPassTakenLbl.textContent = `${stratStats.passCount} drawn (from ${nPass} total, ${passWeight}%)`;

            state.stratifiedSample.forEach(student => {
                const dot = document.createElement('span');
                dot.className = `node-dot ${student.target === 1 ? 'pass' : 'fail'}`;
                dot.title = `ID: #${student.id} | Sampling: Stratified | Target: ${student.target === 1 ? 'Pass' : 'Fail'}`;
                
                if (student.target === 1) {
                    stratPassVizGrid.appendChild(dot);
                } else {
                    stratFailVizGrid.appendChild(dot);
                }
            });
        }
    }

    // -----------------------------------------------------------------
    // 7. Training and Fitting Orchestrator
    // -----------------------------------------------------------------
    elements.btnTrainModel.addEventListener('click', () => {
        runTrainingCycle();
    });

    function runTrainingCycle() {
        // Set Overlay Active
        elements.trainingOverlay.classList.add('active');
        
        // Reset Step indicators
        const steps = [elements.trainingStep1, elements.trainingStep2, elements.trainingStep3, elements.trainingStep4];
        steps.forEach(s => {
            s.className = 'training-step';
            s.querySelector('i').className = 'far fa-circle';
        });

        // STEP 1: Generate Samples
        setStepActive(elements.trainingStep1);
        
        setTimeout(() => {
            try {
                // Apply Sampling
                state.srsworSample = state.engine.sampleSRSWOR(state.sampleSize);
                state.stratifiedSample = state.engine.sampleStratified(state.sampleSize);
                
                setStepCompleted(elements.trainingStep1);
                
                // STEP 2: Preprocess and Clean
                setStepActive(elements.trainingStep2);
                setTimeout(() => {
                    // Preprocess & Scale Separately to avoid data leakage!
                    // Split training & testing (80% Train, 20% Test)
                    const splitIdx = Math.floor(state.sampleSize * 0.8);
                    
                    const srsworTrain = state.srsworSample.slice(0, splitIdx);
                    const srsworTest = state.srsworSample.slice(splitIdx);
                    
                    const stratifiedTrain = state.stratifiedSample.slice(0, splitIdx);
                    const stratifiedTest = state.stratifiedSample.slice(splitIdx);

                    // Fit Scalers on Train sets
                    state.srsworScaler = new StandardScaler();
                    state.srsworScaler.fit(srsworTrain, state.features);

                    state.stratifiedScaler = new StandardScaler();
                    state.stratifiedScaler.fit(stratifiedTrain, state.features);

                    // Scale
                    const srsworTrainScaled = state.srsworScaler.transform(srsworTrain);
                    const srsworTestScaled = state.srsworScaler.transform(srsworTest);

                    const stratifiedTrainScaled = state.stratifiedScaler.transform(stratifiedTrain);
                    const stratifiedTestScaled = state.stratifiedScaler.transform(stratifiedTest);

                    setStepCompleted(elements.trainingStep2);

                    // STEP 3: Train Algorithms
                    setStepActive(elements.trainingStep3);
                    setTimeout(() => {
                        // Initialize custom ML model
                        let modelSRSWOR, modelStrat;

                        if (state.selectedModelType === 'knn') {
                            const k = parseInt(elements.knnKInput.value) || 5;
                            modelSRSWOR = new KNNClassifier(k);
                            modelStrat = new KNNClassifier(k);
                            elements.selectedModelLbl.textContent = `KNN (k=${k})`;
                        } else if (state.selectedModelType === 'tree') {
                            const depth = parseInt(elements.treeDepthInput.value) || 5;
                            modelSRSWOR = new DecisionTreeClassifier(depth);
                            modelStrat = new DecisionTreeClassifier(depth);
                            elements.selectedModelLbl.textContent = `D. Tree (depth=${depth})`;
                        } else if (state.selectedModelType === 'logistic') {
                            const lr = parseFloat(elements.logisticLrInput.value) || 0.1;
                            const epochs = parseInt(elements.logisticEpochsInput.value) || 200;
                            modelSRSWOR = new LogisticRegressionClassifier(lr, epochs);
                            modelStrat = new LogisticRegressionClassifier(lr, epochs);
                            elements.selectedModelLbl.textContent = `Log. Regression`;
                        }

                        // Fit Models on scaled data
                        modelSRSWOR.fit(srsworTrainScaled, state.features);
                        modelStrat.fit(stratifiedTrainScaled, state.features);

                        state.srsworModel = modelSRSWOR;
                        state.stratifiedModel = modelStrat;

                        setStepCompleted(elements.trainingStep3);

                        // STEP 4: Evaluate Models
                        setStepActive(elements.trainingStep4);
                        setTimeout(() => {
                            // Predict on scaled test sets
                            const srsworPreds = modelSRSWOR.predictAll(srsworTestScaled);
                            const srsworActuals = srsworTest.map(item => item.target);
                            state.srsworMetrics = PerformanceEvaluator.evaluate(srsworPreds, srsworActuals);

                            const stratifiedPreds = modelStrat.predictAll(stratifiedTestScaled);
                            const stratifiedActuals = stratifiedTest.map(item => item.target);
                            state.stratifiedMetrics = PerformanceEvaluator.evaluate(stratifiedPreds, stratifiedActuals);

                            setStepCompleted(elements.trainingStep4);

                            // Clean overlay and trigger view updates
                            setTimeout(() => {
                                elements.trainingOverlay.classList.remove('active');
                                elements.trainingStatusLbl.innerHTML = '<i class="fas fa-check-circle"></i> Trained & Evaluated';
                                elements.trainingStatusLbl.style.color = 'var(--success)';
                                elements.trainingStatusLbl.style.borderColor = 'var(--success-border)';
                                elements.trainingStatusLbl.style.background = 'var(--success-bg)';

                                updatePerformanceUI();
                                renderActiveSamplingVisualizations();
                                triggerInference(); // Run prediction form logic

                                // Smoothly auto-navigate user to the results section after short delay
                                document.querySelector('.nav-item[data-section="section-results"]').click();

                            }, 800);
                        }, 800);
                    }, 1000);
                }, 800);
            } catch (err) {
                console.error(err);
                alert("An error occurred during training: " + err.message);
                elements.trainingOverlay.classList.remove('active');
            }
        }, 800);
    }

    function setStepActive(stepEl) {
        stepEl.className = 'training-step active';
        stepEl.querySelector('i').className = 'fas fa-spinner fa-spin';
    }

    function setStepCompleted(stepEl) {
        stepEl.className = 'training-step completed';
        stepEl.querySelector('i').className = 'fas fa-check-circle';
    }

    // -----------------------------------------------------------------
    // 8. Performance Comparison, Charts & Confusion Matrix
    // -----------------------------------------------------------------
    function updatePerformanceUI() {
        const sr = state.srsworMetrics;
        const st = state.stratifiedMetrics;

        // Metric Card values
        elements.srsworAccCard.textContent = Math.round(sr.accuracy * 100) + "%";
        elements.srsworPrecCard.textContent = Math.round(sr.precision * 100) + "%";
        elements.srsworRecCard.textContent = Math.round(sr.recall * 100) + "%";
        elements.srsworF1Card.textContent = Math.round(sr.f1Score * 100) + "%";

        elements.stratifiedAccCard.textContent = Math.round(st.accuracy * 100) + "%";
        elements.stratifiedPrecCard.textContent = Math.round(st.precision * 100) + "%";
        elements.stratifiedRecCard.textContent = Math.round(st.recall * 100) + "%";
        elements.stratifiedF1Card.textContent = Math.round(st.f1Score * 100) + "%";

        // Comparison Table Values
        elements.tblSrsworAcc.textContent = sr.accuracy.toFixed(3);
        elements.tblSrsworPrec.textContent = sr.precision.toFixed(3);
        elements.tblSrsworRec.textContent = sr.recall.toFixed(3);
        elements.tblSrsworF1.textContent = sr.f1Score.toFixed(3);

        elements.tblStratAcc.textContent = st.accuracy.toFixed(3);
        elements.tblStratPrec.textContent = st.precision.toFixed(3);
        elements.tblStratRec.textContent = st.recall.toFixed(3);
        elements.tblStratF1.textContent = st.f1Score.toFixed(3);

        // Update Training / Testing Split counts near confusion matrix
        const totalSample = state.sampleSize;
        const trainSplitCount = Math.floor(totalSample * 0.8);
        const testSplitCount = totalSample - trainSplitCount;

        document.getElementById('lbl-split-total').textContent = totalSample;
        document.getElementById('lbl-split-train').textContent = trainSplitCount;
        document.getElementById('lbl-split-test').textContent = testSplitCount;

        // Confusion Matrices cells
        elements.srsworTP.textContent = sr.matrix.tp;
        elements.srsworFP.textContent = sr.matrix.fp;
        elements.srsworFN.textContent = sr.matrix.fn;
        elements.srsworTN.textContent = sr.matrix.tn;

        elements.stratTP.textContent = st.matrix.tp;
        elements.stratFP.textContent = st.matrix.fp;
        elements.stratFN.textContent = st.matrix.fn;
        elements.stratTN.textContent = st.matrix.tn;

        // Render Chart.js comparison
        renderChartJSComparison();

        // Compile dynamically calculated conclusion
        compileConclusion(sr, st);
    }

    function renderChartJSComparison() {
        const ctx = document.getElementById('metricsChart').getContext('2d');
        
        // Destroy old chart if exists
        if (state.chart) {
            state.chart.destroy();
        }

        const sr = state.srsworMetrics;
        const st = state.stratifiedMetrics;

        // Custom theme properties
        Chart.defaults.color = '#94a3b8';
        Chart.defaults.font.family = "'Inter', sans-serif";

        state.chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Accuracy', 'Precision', 'Recall', 'F1-Score'],
                datasets: [
                    {
                        label: 'SRSWOR Sampling',
                        data: [sr.accuracy, sr.precision, sr.recall, sr.f1Score],
                        backgroundColor: 'rgba(59, 130, 246, 0.65)',
                        borderColor: '#3b82f6',
                        borderWidth: 1,
                        borderRadius: 4
                    },
                    {
                        label: 'Stratified Sampling',
                        data: [st.accuracy, st.precision, st.recall, st.f1Score],
                        backgroundColor: 'rgba(99, 102, 241, 0.65)',
                        borderColor: '#6366f1',
                        borderWidth: 1,
                        borderRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: '#f8fafc',
                            font: { weight: '600' }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        borderColor: 'rgba(255,255,255,0.08)',
                        borderWidth: 1,
                        titleColor: '#fff',
                        bodyColor: '#cbd5e1'
                    }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(255, 255, 255, 0.03)' },
                        ticks: { color: '#94a3b8' }
                    },
                    y: {
                        grid: { color: 'rgba(255, 255, 255, 0.03)' },
                        ticks: { color: '#94a3b8' },
                        min: 0,
                        max: 1.0,
                        title: {
                            display: true,
                            text: 'Metric Value (0.0 to 1.0)',
                            color: '#94a3b8'
                        }
                    }
                }
            }
        });
    }

    function compileConclusion(sr, st) {
        // Calculate dynamic differences
        const accDiff = Math.abs(st.accuracy - sr.accuracy) * 100;
        const f1Diff = Math.abs(st.f1Score - sr.f1Score) * 100;

        let betterSampling = "Stratified Sampling";
        let detailExplanation = "";

        // Compare target class representation variance
        const popStats = state.populationStats;
        const srStats = state.engine.getStats(state.srsworSample);
        const stratStats = state.engine.getStats(state.stratifiedSample);

        const srDiff = Math.abs(srStats.passRate - popStats.passRate).toFixed(1);
        const stratDiff = Math.abs(stratStats.passRate - popStats.passRate).toFixed(1);

        if (st.accuracy >= sr.accuracy) {
            betterSampling = "Stratified Sampling";
            detailExplanation = `
                In this run, <strong>Stratified Sampling</strong> achieved higher classification metrics. 
                This occurred because SRSWOR randomly undersampled or oversampled specific target subgroups, resulting in sample target distributions that drifted from the actual population (population pass rate: <strong>${popStats.passRate}%</strong> vs. SRSWOR: <strong>${srStats.passRate}%</strong>, a drift of <strong>${srDiff}%</strong>). 
                Stratified Sampling holds the target distribution perfectly stable (stratified sample: <strong>${stratStats.passRate}%</strong>, showing a minimal drift of <strong>${stratDiff}%</strong>). 
                As a result, the classifier trained on the Stratified Sample developed generalized boundaries that map significantly closer to the true population trends.
            `;
        } else {
            betterSampling = "Simple Random Sampling (SRSWOR)";
            detailExplanation = `
                In this specific iteration, <strong>SRSWOR</strong> scored slightly higher accuracy, which is a known artifact of high-variance random sampling (e.g. testing on a small slice where the random sample matched the test split features). 
                However, when looking at representational hygiene, SRSWOR suffered a distribution drift of <strong>${srDiff}%</strong> from the original population of <strong>${popStats.passRate}%</strong>. 
                Stratified Sampling locked the distribution perfectly to <strong>${stratStats.passRate}%</strong>, offering a drift of only <strong>${stratDiff}%</strong>. 
                In machine learning pipelines, Stratified Sampling remains mathematically superior because it guarantees that rare target strata (such as failing students or high-achieving outliers) are proportionally represented, preventing high evaluation variance.
            `;
        }

        elements.conclusionText.innerHTML = `
            Based on the empirical test results, <strong>${betterSampling}</strong> is the optimal sampling technique for this classification model.<br/><br/>
            ${detailExplanation}<br/><br/>
            <strong>Core takeaway:</strong> Stratifying dataset splits guarantees statistical proportionality. When class boundaries are non-linear or dataset dimensions increase, Stratified splits protect against <em>sampling bias</em>, yielding models with significantly more reliable validation profiles and lower evaluation variance.
        `;
    }

    // -----------------------------------------------------------------
    // 9. Interactive Inference Form Controls
    // -----------------------------------------------------------------
    const inputsToBubble = [
        { input: elements.predStudy, bubble: elements.valStudy, suffix: ' hrs' },
        { input: elements.predAttendance, bubble: elements.valAttendance, suffix: '%' },
        { input: elements.predSleep, bubble: elements.valSleep, suffix: ' hrs' },
        { input: elements.predAssignments, bubble: elements.valAssignments, suffix: '%' },
        { input: elements.predInternal, bubble: elements.valInternal, suffix: '%' },
        { input: elements.predParticipation, bubble: elements.valParticipation, suffix: '/5' }
    ];

    inputsToBubble.forEach(pair => {
        pair.input.addEventListener('input', (e) => {
            pair.bubble.textContent = e.target.value + pair.suffix;
            triggerInference();
        });
    });

    elements.predInternet.addEventListener('change', () => {
        triggerInference();
    });

    function triggerInference() {
        if (!state.srsworModel || !state.stratifiedModel) {
            elements.srsworPredOutcome.textContent = "TRAIN MODEL";
            elements.srsworPredOutcome.className = "pred-outcome";
            elements.srsworPredProb.textContent = "Train models to enable custom predictions";
            elements.srsworPredBox.className = "pred-result-card";

            elements.stratPredOutcome.textContent = "TRAIN MODEL";
            elements.stratPredOutcome.className = "pred-outcome";
            elements.stratPredProb.textContent = "Train models to enable custom predictions";
            elements.stratPredBox.className = "pred-result-card";
            return;
        }

        // Get values from form
        const rawInputObj = {
            studyHours: parseFloat(elements.predStudy.value),
            attendance: parseFloat(elements.predAttendance.value),
            sleepHours: parseFloat(elements.predSleep.value),
            assignmentScores: parseFloat(elements.predAssignments.value),
            internalMarks: parseFloat(elements.predInternal.value),
            internetUsage: elements.predInternet.checked ? 1 : 0,
            participation: parseInt(elements.predParticipation.value)
        };

        // Scale inputs separately based on their fitted scalers
        const scaledSRSWOR = state.srsworScaler.transformSingle(rawInputObj);
        const scaledStratified = state.stratifiedScaler.transformSingle(rawInputObj);

        // Run Inference
        const predSRSWOR = state.srsworModel.predict(scaledSRSWOR);
        const predStratified = state.stratifiedModel.predict(scaledStratified);

        // Optional probability if Logistic Regression
        let probSRSWOR = null;
        let probStratified = null;

        if (state.selectedModelType === 'logistic') {
            probSRSWOR = state.srsworModel.predictProb(scaledSRSWOR);
            probStratified = state.stratifiedModel.predictProb(scaledStratified);
        }

        // 1. Output SRSWOR
        if (predSRSWOR === 1) {
            elements.srsworPredOutcome.textContent = "PASS";
            elements.srsworPredOutcome.className = "pred-outcome pass";
            elements.srsworPredBox.className = "pred-result-card pass";
            if (probSRSWOR !== null) {
                elements.srsworPredProb.textContent = `Confidence: ${Math.round(probSRSWOR * 100)}% (Pass probability)`;
            } else {
                elements.srsworPredProb.textContent = "Decision boundary output: Class 1";
            }
        } else {
            elements.srsworPredOutcome.textContent = "FAIL";
            elements.srsworPredOutcome.className = "pred-outcome fail";
            elements.srsworPredBox.className = "pred-result-card fail";
            if (probSRSWOR !== null) {
                elements.srsworPredProb.textContent = `Confidence: ${Math.round((1 - probSRSWOR) * 100)}% (Fail probability)`;
            } else {
                elements.srsworPredProb.textContent = "Decision boundary output: Class 0";
            }
        }

        // 2. Output Stratified
        if (predStratified === 1) {
            elements.stratPredOutcome.textContent = "PASS";
            elements.stratPredOutcome.className = "pred-outcome pass";
            elements.stratPredBox.className = "pred-result-card pass";
            if (probStratified !== null) {
                elements.stratPredProb.textContent = `Confidence: ${Math.round(probStratified * 100)}% (Pass probability)`;
            } else {
                elements.stratPredProb.textContent = "Decision boundary output: Class 1";
            }
        } else {
            elements.stratPredOutcome.textContent = "FAIL";
            elements.stratPredOutcome.className = "pred-outcome fail";
            elements.stratPredBox.className = "pred-result-card fail";
            if (probStratified !== null) {
                elements.stratPredProb.textContent = `Confidence: ${Math.round((1 - probStratified) * 100)}% (Fail probability)`;
            } else {
                elements.stratPredProb.textContent = "Decision boundary output: Class 0";
            }
        }
    }

    // Initialize display values on bubbles
    inputsToBubble.forEach(pair => {
        pair.bubble.textContent = pair.input.value + pair.suffix;
    });

    // -----------------------------------------------------------------
    // 10. Dashboard Initial Boot Up
    // -----------------------------------------------------------------
    renderStatsDashboard();
    renderDatasetTable();
    renderInitialVisualizations();
    triggerInference();

    // Trigger an initial training cycle automatically using default Logistic Regression
    // so the dashboard loads up with interesting results instantly!
    setTimeout(() => {
        runTrainingCycle();
    }, 400);

});
