/**
 * Student Performance Sampling Comparison
 * Custom Machine Learning and Preprocessing Engine (ml.js)
 */

class StandardScaler {
    constructor() {
        this.means = {};
        this.stds = {};
        this.features = [];
    }

    /**
     * Calculates means and standard deviations from a training set
     */
    fit(data, features) {
        this.features = features;
        const n = data.length;

        for (const feature of this.features) {
            let sum = 0;
            for (let i = 0; i < n; i++) {
                sum += data[i][feature];
            }
            const mean = sum / n;
            this.means[feature] = mean;

            let sumSquaredDiff = 0;
            for (let i = 0; i < n; i++) {
                sumSquaredDiff += Math.pow(data[i][feature] - mean, 2);
            }
            // Standard deviation with correction for sample variance (n - 1)
            const variance = sumSquaredDiff / Math.max(1, n - 1);
            this.stds[feature] = Math.sqrt(variance) || 1e-8; // Prevent division by zero
        }
    }

    /**
     * Scales a dataset based on fitted statistics
     */
    transform(data) {
        return data.map(item => {
            const scaledItem = { ...item };
            for (const feature of this.features) {
                scaledItem[feature] = (item[feature] - this.means[feature]) / this.stds[feature];
            }
            return scaledItem;
        });
    }

    /**
     * Scales a single input object (for user inference)
     */
    transformSingle(inputObj) {
        const scaled = { ...inputObj };
        for (const feature of this.features) {
            if (feature in inputObj) {
                scaled[feature] = (inputObj[feature] - this.means[feature]) / this.stds[feature];
            }
        }
        return scaled;
    }
}

class KNNClassifier {
    constructor(k = 5) {
        this.k = k;
        this.X = [];
        this.y = [];
        this.features = [];
    }

    fit(data, features) {
        this.features = features;
        this.X = data.map(item => this.features.map(f => item[f]));
        this.y = data.map(item => item.target);
    }

    predict(item) {
        const query = this.features.map(f => item[f]);
        const distances = [];

        for (let i = 0; i < this.X.length; i++) {
            let sumSq = 0;
            for (let j = 0; j < query.length; j++) {
                sumSq += Math.pow(query[j] - this.X[i][j], 2);
            }
            distances.push({
                dist: Math.sqrt(sumSq),
                label: this.y[i]
            });
        }

        // Sort by distance ascending
        distances.sort((a, b) => a.dist - b.dist);

        // Get top k neighbors
        const kNeighbors = distances.slice(0, this.k);

        // Majority vote
        let votesFor1 = 0;
        for (const neighbor of kNeighbors) {
            if (neighbor.label === 1) votesFor1++;
        }

        return votesFor1 > (this.k / 2) ? 1 : 0;
    }

    predictAll(dataset) {
        return dataset.map(item => this.predict(item));
    }
}

class DecisionTreeClassifier {
    constructor(maxDepth = 5, minSamplesSplit = 2) {
        this.maxDepth = maxDepth;
        this.minSamplesSplit = minSamplesSplit;
        this.root = null;
        this.features = [];
    }

    fit(data, features) {
        this.features = features;
        const formattedData = data.map(item => {
            const row = this.features.map(f => item[f]);
            row.push(item.target); // Target is last element
            return row;
        });

        this.root = this.buildTree(formattedData, 0);
    }

    buildTree(data, depth) {
        const numSamples = data.length;
        if (numSamples === 0) return null;

        const labels = data.map(row => row[row.length - 1]);
        const uniqueLabels = [...new Set(labels)];

        // Base cases: all samples have same label, or reached max depth, or too few samples to split
        if (uniqueLabels.length === 1) {
            return { isLeaf: true, value: uniqueLabels[0] };
        }
        if (depth >= this.maxDepth || numSamples < this.minSamplesSplit) {
            return { isLeaf: true, value: this.majorityLabel(labels) };
        }

        // Find the best split
        let bestSplit = null;
        let bestGiniGain = -1;

        const numFeatures = this.features.length;
        const currentGini = this.calculateGini(labels);

        for (let fIdx = 0; fIdx < numFeatures; fIdx++) {
            const values = data.map(row => row[fIdx]);
            // Sort unique values to find split candidates
            const uniqueValues = [...new Set(values)].sort((a, b) => a - b);

            for (let i = 0; i < uniqueValues.length - 1; i++) {
                const threshold = (uniqueValues[i] + uniqueValues[i + 1]) / 2;
                
                // Split dataset
                const left = [];
                const right = [];
                for (let r = 0; r < numSamples; r++) {
                    if (data[r][fIdx] <= threshold) {
                        left.push(data[r]);
                    } else {
                        right.push(data[r]);
                    }
                }

                if (left.length === 0 || right.length === 0) continue;

                // Calculate Gini Gain
                const leftLabels = left.map(row => row[row.length - 1]);
                const rightLabels = right.map(row => row[row.length - 1]);

                const leftGini = this.calculateGini(leftLabels);
                const rightGini = this.calculateGini(rightLabels);

                const splitGini = (left.length / numSamples) * leftGini + (right.length / numSamples) * rightGini;
                const giniGain = currentGini - splitGini;

                if (giniGain > bestGiniGain) {
                    bestGiniGain = giniGain;
                    bestSplit = {
                        featureIdx: fIdx,
                        threshold: threshold,
                        leftData: left,
                        rightData: right
                    };
                }
            }
        }

        // If no split provides improvement, return a leaf node
        if (!bestSplit || bestGiniGain <= 1e-7) {
            return { isLeaf: true, value: this.majorityLabel(labels) };
        }

        // Recursively build child nodes
        const leftNode = this.buildTree(bestSplit.leftData, depth + 1);
        const rightNode = this.buildTree(bestSplit.rightData, depth + 1);

        return {
            isLeaf: false,
            featureIdx: bestSplit.featureIdx,
            threshold: bestSplit.threshold,
            left: leftNode,
            right: rightNode
        };
    }

    calculateGini(labels) {
        const count = labels.length;
        if (count === 0) return 0;

        let passCount = 0;
        for (const l of labels) {
            if (l === 1) passCount++;
        }
        const p1 = passCount / count;
        const p0 = 1 - p1;

        return 1 - (p1 * p1 + p0 * p0);
    }

    majorityLabel(labels) {
        let ones = 0;
        for (const l of labels) {
            if (l === 1) ones++;
        }
        return ones >= (labels.length / 2) ? 1 : 0;
    }

    predict(item) {
        const row = this.features.map(f => item[f]);
        return this.traverseTree(this.root, row);
    }

    traverseTree(node, row) {
        if (!node) return 0;
        if (node.isLeaf) return node.value;

        const val = row[node.featureIdx];
        if (val <= node.threshold) {
            return this.traverseTree(node.left, row);
        } else {
            return this.traverseTree(node.right, row);
        }
    }

    predictAll(dataset) {
        return dataset.map(item => this.predict(item));
    }
}

class LogisticRegressionClassifier {
    constructor(learningRate = 0.1, epochs = 250) {
        this.lr = learningRate;
        this.epochs = epochs;
        this.weights = [];
        this.bias = 0;
        this.features = [];
    }

    fit(data, features) {
        this.features = features;
        const X = data.map(item => this.features.map(f => item[f]));
        const y = data.map(item => item.target);

        const numSamples = X.length;
        const numFeatures = this.features.length;

        // Initialize parameters to 0
        this.weights = new Array(numFeatures).fill(0);
        this.bias = 0;

        // Gradient Descent
        for (let epoch = 0; epoch < this.epochs; epoch++) {
            const predictions = [];
            const errors = [];

            for (let i = 0; i < numSamples; i++) {
                // Compute linear sum
                let linearSum = this.bias;
                for (let j = 0; j < numFeatures; j++) {
                    linearSum += X[i][j] * this.weights[j];
                }
                const pred = this.sigmoid(linearSum);
                predictions.push(pred);
                errors.push(pred - y[i]);
            }

            // Compute Gradients
            const dW = new Array(numFeatures).fill(0);
            let dB = 0;

            for (let i = 0; i < numSamples; i++) {
                dB += errors[i];
                for (let j = 0; j < numFeatures; j++) {
                    dW[j] += errors[i] * X[i][j];
                }
            }

            // Update Weights and Bias
            this.bias -= (this.lr * dB) / numSamples;
            for (let j = 0; j < numFeatures; j++) {
                this.weights[j] -= (this.lr * dW[j]) / numSamples;
            }
        }
    }

    sigmoid(z) {
        return 1 / (1 + Math.exp(-Math.max(-20, Math.min(20, z)))); // Cap z to prevent overflow/underflow
    }

    predictProb(item) {
        const query = this.features.map(f => item[f]);
        let linearSum = this.bias;
        for (let j = 0; j < this.weights.length; j++) {
            linearSum += query[j] * this.weights[j];
        }
        return this.sigmoid(linearSum);
    }

    predict(item) {
        return this.predictProb(item) >= 0.5 ? 1 : 0;
    }

    predictAll(dataset) {
        return dataset.map(item => this.predict(item));
    }
}

/**
 * Static class to evaluate model performance and compute statistics.
 */
class PerformanceEvaluator {
    static evaluate(predictions, actual) {
        if (predictions.length !== actual.length || predictions.length === 0) {
            return {
                accuracy: 0,
                precision: 0,
                recall: 0,
                f1Score: 0,
                matrix: { tp: 0, fp: 0, fn: 0, tn: 0 }
            };
        }

        let tp = 0; // True Positive (Actual Pass, Predicted Pass)
        let fp = 0; // False Positive (Actual Fail, Predicted Pass)
        let fn = 0; // False Negative (Actual Pass, Predicted Fail)
        let tn = 0; // True Negative (Actual Fail, Predicted Fail)

        for (let i = 0; i < predictions.length; i++) {
            const pred = predictions[i];
            const act = actual[i];

            if (act === 1 && pred === 1) tp++;
            else if (act === 0 && pred === 1) fp++;
            else if (act === 1 && pred === 0) fn++;
            else if (act === 0 && pred === 0) tn++;
        }

        const count = predictions.length;
        const accuracy = (tp + tn) / count;
        
        const precision = (tp + fp) > 0 ? tp / (tp + fp) : 0;
        const recall = (tp + fn) > 0 ? tp / (tp + fn) : 0;
        
        const f1Score = (precision + recall) > 0 
            ? 2 * (precision * recall) / (precision + recall) 
            : 0;

        return {
            accuracy: Math.round(accuracy * 1000) / 1000,
            precision: Math.round(precision * 1000) / 1000,
            recall: Math.round(recall * 1000) / 1000,
            f1Score: Math.round(f1Score * 1000) / 1000,
            matrix: { tp, fp, fn, tn }
        };
    }
}

// Export modules to browser
window.StandardScaler = StandardScaler;
window.KNNClassifier = KNNClassifier;
window.DecisionTreeClassifier = DecisionTreeClassifier;
window.LogisticRegressionClassifier = LogisticRegressionClassifier;
window.PerformanceEvaluator = PerformanceEvaluator;
