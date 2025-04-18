// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAvAliML01AuacHMIvgSLFdtDr__b_CQ3s",
  authDomain: "xamly-4557f.firebaseapp.com",
  projectId: "xamly-4557f",
  storageBucket: "xamly-4557f.firebasestorage.app",
  messagingSenderId: "1017664219023",
  appId: "1:1017664219023:web:a26149c22dd86396b84dfa",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Make functions globally accessible
window.showCreateExam = showCreateExam;
window.showGradeExams = showGradeExams;
window.showExamList = showExamList;
window.createExam = createExam;
window.gradeExams = gradeExams;
window.logout = logout;
window.removeQuestion = removeQuestion; // Ensure global exposure

console.log("removeQuestion function defined:", typeof window.removeQuestion === 'function');

document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM loaded for teacher dashboard");
  const toggle = document.querySelector('.navbar-toggle');
  const menu = document.querySelector('.navbar-menu');
  const contentDiv = document.getElementById('content');
  const welcomeMessage = document.getElementById('welcome-message');

  console.log("contentDiv:", contentDiv, "welcomeMessage:", welcomeMessage);

  if (!contentDiv || !welcomeMessage) {
    alert('Content or welcome message div not found! Check HTML IDs.');
    return;
  }

  // Set welcome message
  const user = auth.currentUser;
  if (user) {
    welcomeMessage.textContent = `Welcome, ${user.email}!`;
  }

  toggle.addEventListener('click', () => {
    menu.classList.toggle('active');
  });

  // Event delegation for remove buttons
  const customQuestionsDiv = document.getElementById('custom-questions');
  if (customQuestionsDiv) {
    console.log("Event listener attached to custom-questions");
    customQuestionsDiv.addEventListener('click', (e) => {
      console.log("Click detected on custom-questions, target:", e.target);
      if (e.target.classList.contains('btn-danger')) {
        removeQuestion(e.target);
      }
    });
  }
});

function showCreateExam() {
  const contentDiv = document.getElementById('content');
  contentDiv.innerHTML = `
    <h3>Create Exam</h3>
    <div class="exam-form">
      <input type="text" id="exam-title" placeholder="Exam Title" class="w-full p-2 border rounded" required>
      <input type="number" id="exam-duration" placeholder="Duration (minutes)" class="w-full p-2 border rounded" required>
      <select id="exam-source" class="w-full p-2 border rounded">
        <option value="predefined">Predefined</option>
        <option value="custom">Custom</option>
      </select>
      <div id="question-inputs" class="hidden mt-4">
        <div class="mb-4">
          <label class="block text-sm font-medium">Question Type:</label>
          <select id="question-type" class="w-full p-2 border rounded">
            <option value="mcq" selected>Multiple Choice (MCQ)</option>
            <option value="subjective">Subjective</option>
          </select>
        </div>
        <input type="number" id="question-id" placeholder="Question ID (optional)" class="w-full p-2 border rounded">
        <input type="text" id="question-text" placeholder="Question Text" class="w-full p-2 border rounded" required>
        <div id="mcq-options" class="hidden mt-2">
          <div class="grid grid-cols-2 gap-2">
            <input type="text" id="option1" placeholder="Option 1" class="p-2 border rounded w-full" required>
            <input type="text" id="option2" placeholder="Option 2" class="p-2 border rounded w-full" required>
            <input type="text" id="option3" placeholder="Option 3" class="p-2 border rounded w-full" required>
            <input type="text" id="option4" placeholder="Option 4" class="p-2 border rounded w-full" required>
          </div>
          <select id="correct-option" class="w-full p-2 border rounded mt-2">
            <option value="1">Option 1</option>
            <option value="2">Option 2</option>
            <option value="3">Option 3</option>
            <option value="4">Option 4</option>
          </select>
        </div>
        <textarea id="subjective-answer" class="w-full p-2 border rounded mt-2 hidden" placeholder="Expected Answer"></textarea>
        <button id="add-question-btn" class="btn btn-primary mt-2">Add Question</button>
        <div id="custom-questions" class="mt-4"></div>
      </div>
      <input type="number" id="num-questions" placeholder="Number of Questions" class="w-full p-2 border rounded mt-2" min="1" required>
      <button onclick="createExam()" class="btn btn-primary mt-2">Create Exam</button>
    </div>
  `;
  console.log("showCreateExam executed");
  const sourceSelect = document.getElementById('exam-source');
  const questionInputs = document.getElementById('question-inputs');
  const questionType = document.getElementById('question-type');
  const mcqOptions = document.getElementById('mcq-options');
  const subjectiveAnswer = document.getElementById('subjective-answer');
  const addQuestionBtn = document.getElementById('add-question-btn');
  const numQuestionsInput = document.getElementById('num-questions');

  sourceSelect.addEventListener('change', () => {
    questionInputs.classList.toggle('hidden', sourceSelect.value !== 'custom');
    numQuestionsInput.classList.toggle('hidden', sourceSelect.value === 'custom'); // Hide for custom
    if (sourceSelect.value === 'custom') {
      updateQuestionTypeVisibility(); // Trigger initial visibility
    }
  });

  questionType.addEventListener('change', () => {
    console.log('Question type changed to:', questionType.value); // Debug log
    updateQuestionTypeVisibility();
  });

  addQuestionBtn.addEventListener('click', addQuestion); // Explicit event listener

  // Initial setup for custom selection
  if (sourceSelect.value === 'custom') {
    updateQuestionTypeVisibility();
    numQuestionsInput.classList.add('hidden'); // Hide initially if custom
  }
}

function updateQuestionTypeVisibility() {
  const questionType = document.getElementById('question-type');
  const mcqOptions = document.getElementById('mcq-options');
  const subjectiveAnswer = document.getElementById('subjective-answer');
  mcqOptions.classList.toggle('hidden', questionType.value !== 'mcq');
  subjectiveAnswer.classList.toggle('hidden', questionType.value !== 'subjective');
}

function showGradeExams() {
  const contentDiv = document.getElementById('content');
  contentDiv.innerHTML = `
    <h3>Grade Exams</h3>
    <div class="exam-form">
      <input type="text" id="grade-exam-code" placeholder="Exam Code" class="w-full p-2 border rounded" required>
      <button onclick="gradeExams()" class="btn btn-primary mt-2">Grade</button>
    </div>
  `;
}

function showExamList() {
  const contentDiv = document.getElementById('content');
  contentDiv.innerHTML = '<h3>Exam List</h3><div id="exam-list" class="exam-list"></div>';
  getDocs(collection(db, 'exams')).then(querySnapshot => {
    let html = '';
    querySnapshot.forEach(docSnap => {
      const { title, code } = docSnap.data();
      html += `<div class="exam-item"><p>${title} (Code: ${code})</p></div>`;
    });
    document.getElementById('exam-list').innerHTML = html || '<p>No exams yet.</p>';
  }).catch(error => alert('Error: ' + error.message));
}

function addQuestion() {
  const questionType = document.getElementById('question-type').value;
  const id = document.getElementById('question-id').value ? parseInt(document.getElementById('question-id').value) : Date.now(); // Default to timestamp if blank
  const questionText = document.getElementById('question-text').value;
  let options, answer;

  if (questionType === 'mcq') {
    options = [
      document.getElementById('option1').value,
      document.getElementById('option2').value,
      document.getElementById('option3').value,
      document.getElementById('option4').value
    ];
    answer = options[parseInt(document.getElementById('correct-option').value) - 1];
    if (new Set(options).size !== 4 || options.some(opt => !opt.trim())) {
      alert('Please provide four unique, non-empty options for MCQ!');
      return;
    }
  } else {
    options = null;
    answer = document.getElementById('subjective-answer').value.trim();
    if (!answer) {
      alert('Please provide a non-empty expected answer for subjective question!');
      return;
    }
  }

  if (!questionText.trim()) {
    alert('Please provide a valid Question text!');
    return;
  }

  const question = { id, type: questionType, question: questionText, options, answer };
  const customQuestionsDiv = document.getElementById('custom-questions');
  customQuestionsDiv.innerHTML += `
    <div class="question bg-gray-100 p-2 rounded mb-2" data-id="${id}">
      <p><strong>${questionText}</strong> (Type: ${questionType})</p>
      ${questionType === 'mcq' ? `<p>Options: ${options.join(', ')}, Correct: ${answer}</p>` : `<p>Answer: ${answer}</p>`}
      <button class="btn btn-danger mt-1">Remove</button>
    </div>
  `;
  const questions = [...(JSON.parse(customQuestionsDiv.dataset.questions || '[]')), question];
  customQuestionsDiv.dataset.questions = JSON.stringify(questions);
  // Clear inputs
  document.getElementById('question-id').value = '';
  document.getElementById('question-text').value = '';
  if (questionType === 'mcq') {
    ['option1', 'option2', 'option3', 'option4'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('correct-option').value = '1';
  } else {
    document.getElementById('subjective-answer').value = '';
  }
}

function removeQuestion(button) {
  console.log('Removing question, button:', button, 'parent:', button.parentElement, 'id:', button.parentElement.dataset.id); // Detailed debug log
  const questionDiv = button.parentElement;
  const id = parseInt(questionDiv.dataset.id);
  const customQuestionsDiv = document.getElementById('custom-questions');
  let questions = JSON.parse(customQuestionsDiv.dataset.questions || '[]');
  questions = questions.filter(q => q.id !== id);
  customQuestionsDiv.dataset.questions = JSON.stringify(questions);
  questionDiv.remove();
}

function createExam() {
  console.log("createExam called");
  const title = document.getElementById('exam-title').value.trim();
  const duration = document.getElementById('exam-duration').value;
  const source = document.getElementById('exam-source').value;
  const numQuestions = source === 'predefined' ? parseInt(document.getElementById('num-questions').value) : JSON.parse(document.getElementById('custom-questions').dataset.questions || '[]').length;
  const customQuestionsDiv = document.getElementById('custom-questions');
  let questions;

  if (!title || !duration || (source === 'predefined' && !numQuestions)) {
    alert('Please fill all required fields!');
    return;
  }

  if (source === 'predefined') {
    questions = generateQuestions(numQuestions, source);
  } else {
    questions = JSON.parse(customQuestionsDiv.dataset.questions || '[]');
    if (questions.length === 0) {
      alert('Please add at least one question!');
      return;
    }
  }

  const code = generateExamCode();
  setDoc(doc(db, 'exams', code), { title, duration, questions, code }).then(() => {
    console.log(`Exam created with code: ${code}`);
    alert(`Exam created! Code: ${code}`);
    downloadExamPaper(code, title, questions);
  }).catch(error => alert('Error: ' + error.message));
}

function downloadExamPaper(code, title, questions) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text(`${title} (Code: ${code})`, 10, 10);
  doc.setFontSize(12);
  doc.text(`Duration: ${questions.length} minutes`, 10, 20);
  let y = 30;
  questions.forEach((q, index) => {
    doc.text(`${index + 1}. ${q.question}`, 10, y);
    y += 10;
    if (q.type === 'mcq') {
      q.options.forEach((opt, i) => {
        doc.text(`${String.fromCharCode(97 + i)}. ${opt}`, 15, y);
        y += 10;
      });
      y += 10;
    } else {
      doc.text(`Answer: ${q.answer}`, 15, y);
      y += 10;
    }
    if (y > 280) {
      doc.addPage();
      y = 10;
    }
  });
  doc.save(`${title}_${code}_exam.pdf`);
}

function generateQuestions(num, source) {
  const predefinedQuestions = [
    { id: 1, type: 'mcq', question: 'What is the primary goal of supervised learning?', options: ['To label data', 'To find patterns in data', 'To predict outcomes based on input data', 'To cluster data'], answer: 'To predict outcomes based on input data' },
        { id: 2, type: 'mcq', question: 'Which of the following is a supervised learning algorithm?', options: ['K-Means', 'Linear Regression', 'Apriori', 'PCA'], answer: 'Linear Regression' },
        { id: 3, type: 'mcq', question: 'Which of the following is NOT a type of machine learning?', options: ['Supervised', 'Unsupervised', 'Reinforcement', 'Associated'], answer: 'Associated' },
        { id: 4, type: 'mcq', question: 'What is overfitting in machine learning?', options: ['Model performs well on training data but poorly on test data', 'Model performs poorly on both', 'Model performs well on test data only', 'Model doesn’t train at all'], answer: 'Model performs well on training data but poorly on test data' },
        { id: 5, type: 'mcq', question: 'Which algorithm is best suited for classification problems?', options: ['Linear Regression', 'Logistic Regression', 'K-Means', 'PCA'], answer: 'Logistic Regression' },
        { id: 6, type: 'mcq', question: 'Which metric is used to evaluate classification models?', options: ['MSE', 'Accuracy', 'R-squared', 'MAE'], answer: 'Accuracy' },
        { id: 7, type: 'mcq', question: 'KNN stands for:', options: ['K-Nearest Numbers', 'K-Nearest Neighbors', 'Key Neural Network', 'K-Node Network'], answer: 'K-Nearest Neighbors' },
        { id: 8, type: 'mcq', question: 'Which one is an example of an unsupervised learning algorithm?', options: ['Logistic Regression', 'K-Means Clustering', 'Decision Tree', 'Random Forest'], answer: 'K-Means Clustering' },
        { id: 9, type: 'mcq', question: 'What does PCA stand for?', options: ['Principal Component Algorithm', 'Primary Cluster Algorithm', 'Principal Component Analysis', 'Probabilistic Clustering Approach'], answer: 'Principal Component Analysis' },
        { id: 10, type: 'mcq', question: 'What is the purpose of training data in machine learning?', options: ['To test model accuracy', 'To tune hyperparameters', 'To build the model', 'To validate output'], answer: 'To build the model' },
        { id: 11, type: 'mcq', question: 'Which of these is a dimensionality reduction technique?', options: ['Gradient Descent', 'PCA', 'Random Forest', 'Naive Bayes'], answer: 'PCA' },
        { id: 12, type: 'mcq', question: 'Which one is a popular library for machine learning in Python?', options: ['NumPy', 'Pandas', 'Scikit-learn', 'Flask'], answer: 'Scikit-learn' },
        { id: 13, type: 'mcq', question: 'What does "bias" refer to in ML?', options: ['Accuracy of model', 'Error from wrong assumptions', 'Model complexity', 'Error due to variance'], answer: 'Error from wrong assumptions' },
        { id: 14, type: 'mcq', question: 'Which algorithm is best for reducing bias in decision trees?', options: ['Logistic Regression', 'Random Forest', 'Naive Bayes', 'SVM'], answer: 'Random Forest' },
        { id: 15, type: 'mcq', question: 'Which of these is used in reinforcement learning?', options: ['Reward and punishment', 'Labels', 'Clustering', 'Principal components'], answer: 'Reward and punishment' },
        { id: 16, type: 'mcq', question: 'Which term describes the ability of a model to perform well on unseen data?', options: ['Training', 'Overfitting', 'Underfitting', 'Generalization'], answer: 'Generalization' },
        { id: 17, type: 'mcq', question: 'What is the role of the activation function in a neural network?', options: ['Calculate loss', 'Decide output of a node', 'Add noise', 'Store weights'], answer: 'Decide output of a node' },
        { id: 18, type: 'mcq', question: 'Which algorithm uses a hyperplane for classification?', options: ['KNN', 'Decision Tree', 'SVM', 'Random Forest'], answer: 'SVM' },
        { id: 19, type: 'mcq', question: 'Which evaluation metric is best for imbalanced datasets?', options: ['Accuracy', 'Precision', 'Recall', 'F1-Score'], answer: 'F1-Score' },
        { id: 20, type: 'mcq', question: 'Gradient Descent is used to:', options: ['Increase model accuracy', 'Optimize loss function', 'Train neural networks only', 'Remove outliers'], answer: 'Optimize loss function' },
        { id: 21, type: 'mcq', question: 'Which of the following is a feature selection technique?', options: ['Label encoding', 'One-hot encoding', 'Recursive Feature Elimination', 'Z-score normalization'], answer: 'Recursive Feature Elimination' },
        { id: 22, type: 'mcq', question: 'The output of a classification model is usually:', options: ['A continuous value', 'A probability', 'A categorical label', 'A histogram'], answer: 'A categorical label' },
        { id: 23, type: 'mcq', question: 'Which of these can cause underfitting?', options: ['Too few features', 'Too complex model', 'Too much training', 'Too much data'], answer: 'Too few features' },
        { id: 24, type: 'mcq', question: 'Naive Bayes is based on:', options: ['Bayes Theorem', 'Gradient Descent', 'Clustering', 'Principal Component Analysis'], answer: 'Bayes Theorem' },
        { id: 25, type: 'mcq', question: 'Which of the following is a performance measure for regression?', options: ['Precision', 'Recall', 'Mean Squared Error', 'F1-Score'], answer: 'Mean Squared Error' },
        { id: 26, type: 'mcq', question: 'Which ML model works well with text classification?', options: ['Naive Bayes', 'K-Means', 'PCA', 'Linear Regression'], answer: 'Naive Bayes' },
        { id: 27, type: 'mcq', question: 'Which library is commonly used for deep learning?', options: ['Scikit-learn', 'TensorFlow', 'Matplotlib', 'Seaborn'], answer: 'TensorFlow' },
        { id: 28, type: 'mcq', question: 'Which technique is used to avoid overfitting in neural networks?', options: ['Increasing layers', 'Gradient descent', 'Dropout', 'Normalization'], answer: 'Dropout' },
        { id: 29, type: 'mcq', question: 'What does an ROC curve represent?', options: ['Training loss', 'Accuracy vs Epochs', 'True Positive Rate vs False Positive Rate', 'Bias vs Variance'], answer: 'True Positive Rate vs False Positive Rate' },
        { id: 30, type: 'mcq', question: 'Which of these is an ensemble method?', options: ['Decision Tree', 'Random Forest', 'SVM', 'KNN'], answer: 'Random Forest' },
        { id: 31, type: 'mcq', question: 'What is a hyperparameter in machine learning?', options: ['Parameter learned during training', 'External configuration set before training', 'Input data', 'Output prediction'], answer: 'External configuration set before training' },
        { id: 32, type: 'mcq', question: 'Which ML technique is best for anomaly detection?', options: ['Classification', 'Clustering', 'Regression', 'Supervised Learning'], answer: 'Clustering' },
        { id: 33, type: 'mcq', question: 'Which of the following is used to split data into train and test sets?', options: ['train_test_split()', 'split_data()', 'train_val_split()', 'separate_data()'], answer: 'train_test_split()' },
        { id: 34, type: 'mcq', question: 'Which is an example of reinforcement learning?', options: ['Linear Regression', 'Q-Learning', 'K-Means', 'Naive Bayes'], answer: 'Q-Learning' },
        { id: 35, type: 'mcq', question: 'Which method is used for feature scaling?', options: ['One-hot encoding', 'Min-Max Normalization', 'Label encoding', 'Data splitting'], answer: 'Min-Max Normalization' },
        { id: 36, type: 'mcq', question: 'Which activation function is commonly used in hidden layers?', options: ['Sigmoid', 'ReLU', 'Softmax', 'Linear'], answer: 'ReLU' },
        { id: 37, type: 'mcq', question: 'Which model is known for using a "kernel trick"?', options: ['KNN', 'Naive Bayes', 'SVM', 'Decision Tree'], answer: 'SVM' },
        { id: 38, type: 'mcq', question: 'Which term refers to how a model reacts to small changes in the data?', options: ['Bias', 'Variance', 'Noise', 'Regularization'], answer: 'Variance' },
        { id: 39, type: 'mcq', question: 'What is the goal of clustering?', options: ['Classify new examples', 'Label the data', 'Group similar data points', 'Predict numerical value'], answer: 'Group similar data points' },
        { id: 40, type: 'mcq', question: 'Which ML model is based on probability and works best with independent features?', options: ['KNN', 'Naive Bayes', 'SVM', 'Decision Tree'], answer: 'Naive Bayes' },
        { id: 41, type: 'mcq', question: 'Which type of learning uses labeled data?', options: ['Unsupervised', 'Reinforcement', 'Supervised', 'Semi-supervised'], answer: 'Supervised' },
        { id: 42, type: 'mcq', question: 'Which ML concept deals with balancing bias and variance?', options: ['Normalization', 'Cross-validation', 'Regularization', 'Ensembling'], answer: 'Regularization' },
        { id: 43, type: 'mcq', question: 'Which library is best for data preprocessing in Python?', options: ['Matplotlib', 'NumPy', 'Pandas', 'Seaborn'], answer: 'Pandas' },
        { id: 44, type: 'mcq', question: 'Which algorithm is a type of instance-based learning?', options: ['SVM', 'KNN', 'Random Forest', 'Logistic Regression'], answer: 'KNN' },
        { id: 45, type: 'mcq', question: 'Which algorithm divides data into k groups based on similarity?', options: ['Logistic Regression', 'K-Means', 'Naive Bayes', 'SVM'], answer: 'K-Means' },
        { id: 46, type: 'mcq', question: 'Which component improves the performance of decision trees?', options: ['Boosting', 'Overfitting', 'Normalization', 'Dropout'], answer: 'Boosting' },
        { id: 47, type: 'mcq', question: 'What is a confusion matrix used for?', options: ['Visualizing loss', 'Detecting clusters', 'Evaluating classification models', 'Improving accuracy'], answer: 'Evaluating classification models' },
        { id: 48, type: 'mcq', question: 'What is the main objective of regression algorithms?', options: ['Classify labels', 'Predict categorical data', 'Group data', 'Predict continuous values'], answer: 'Predict continuous values' },
        { id: 49, type: 'mcq', question: 'Which of these is a tree-based algorithm?', options: ['SVM', 'Logistic Regression', 'Decision Tree', 'PCA'], answer: 'Decision Tree' },
        { id: 50, type: 'mcq', question: 'Which learning type is used when feedback is provided as rewards or penalties?', options: ['Supervised', 'Unsupervised', 'Reinforcement', 'Clustering'], answer: 'Reinforcement' },
        { id: 51, type: 'mcq', question: 'Which process reduces the number of features without losing important information?', options: ['Encoding', 'Dimensionality Reduction', 'Training', 'Overfitting'], answer: 'Dimensionality Reduction' },
        { id: 52, type: 'mcq', question: 'Which of these helps in visualizing high-dimensional data?', options: ['Confusion Matrix', 't-SNE', 'ROC Curve', 'Correlation Matrix'], answer: 't-SNE' },
        { id: 53, type: 'mcq', question: 'Which one is NOT a metric for classification models?', options: ['Precision', 'Recall', 'MAE', 'F1-Score'], answer: 'MAE' },
        { id: 54, type: 'mcq', question: 'Which of these models is affected the most by outliers?', options: ['Decision Tree', 'Random Forest', 'Linear Regression', 'SVM'], answer: 'Linear Regression' },
        { id: 55, type: 'mcq', question: 'Which step comes first in a typical ML pipeline?', options: ['Model training', 'Data preprocessing', 'Evaluation', 'Hyperparameter tuning'], answer: 'Data preprocessing' },
        { id: 56, type: 'mcq', question: 'Which is an example of a generative model?', options: ['CNN', 'GAN', 'RNN', 'SVM'], answer: 'GAN' },
        { id: 57, type: 'mcq', question: 'What is the purpose of cross-validation?', options: ['To preprocess data', 'To evaluate model performance on unseen data', 'To increase dataset size', 'To reduce dimensionality'], answer: 'To evaluate model performance on unseen data' },
        { id: 58, type: 'mcq', question: 'Which of these can be used for both classification and regression?', options: ['Decision Tree', 'Logistic Regression', 'KNN', 'SVM'], answer: 'Decision Tree' },
        { id: 59, type: 'mcq', question: 'What is the typical range of values for correlation?', options: ['0 to 1', '-1 to 1', '-2 to 2', '0 to 100'], answer: '-1 to 1' },
        { id: 60, type: 'mcq', question: 'Which ML term means "number of independent variables"?', options: ['Samples', 'Features', 'Instances', 'Targets'], answer: 'Features' },
        { id: 61, type: 'mcq', question: 'Which function is used for binary classification in logistic regression?', options: ['ReLU', 'Sigmoid', 'Softmax', 'Linear'], answer: 'Sigmoid' },
        { id: 62, type: 'mcq', question: 'Which method is used to combine multiple weak learners?', options: ['Ensembling', 'Stacking', 'Boosting', 'All of these'], answer: 'All of these' },
        { id: 63, type: 'mcq', question: 'Which of these is used to identify multicollinearity?', options: ['ROC Curve', 'Variance Inflation Factor', 'PCA', 'Loss Curve'], answer: 'Variance Inflation Factor' },
        { id: 64, type: 'mcq', question: 'Which learning algorithm does NOT require labeled data?', options: ['Supervised Learning', 'Unsupervised Learning', 'Reinforcement Learning', 'Semi-Supervised Learning'], answer: 'Unsupervised Learning' },
        { id: 65, type: 'mcq', question: 'Which error type refers to missing a positive class?', options: ['True Negative', 'False Negative', 'False Positive', 'True Positive'], answer: 'False Negative' },
        { id: 66, type: 'mcq', question: 'Which algorithm is most suitable for spam detection?', options: ['KNN', 'Naive Bayes', 'K-Means', 'SVM'], answer: 'Naive Bayes' },
        { id: 67, type: 'mcq', question: 'What is model interpretability?', options: ['Accuracy measurement', 'Explaining how model predictions are made', 'Improving performance', 'Hyperparameter tuning'], answer: 'Explaining how model predictions are made' },
        { id: 68, type: 'mcq', question: 'Which is true for bagging?', options: ['Reduces variance', 'Increases bias', 'Used in PCA', 'Increases overfitting'], answer: 'Reduces variance' },
        { id: 69, type: 'mcq', question: 'Which process is used to convert categorical variables to numerical?', options: ['Standardization', 'Encoding', 'Clustering', 'Filtering'], answer: 'Encoding' },
        { id: 70, type: 'mcq', question: 'Which metric measures the difference between predicted and actual values?', options: ['Accuracy', 'Recall', 'MSE', 'Precision'], answer: 'MSE' }
  ];
  return source === 'predefined' ? predefinedQuestions.slice(0, num) : [];
}

function generateExamCode() {
  return Math.random().toString(36).substr(2, 6).toUpperCase();
}

function gradeExams() {
  const examCode = document.getElementById('grade-exam-code').value;
  getDocs(query(collection(db, 'submissions'), where('examId', '==', examCode))).then(querySnapshot => {
    querySnapshot.forEach(docSnap => {
      const submission = docSnap.data();
      let score = 0;
      submission.answers.forEach((answer, index) => {
        if (answer === submission.questions[index].answer) score++;
      });
      setDoc(doc(db, 'grades', `${examCode}_${submission.studentEmail}`), {
        examId: examCode,
        studentEmail: submission.studentEmail,
        score,
        maxScore: submission.questions.length
      }).then(() => alert('Grades submitted!'));
    });
  }).catch(error => alert('Error: ' + error.message));
}