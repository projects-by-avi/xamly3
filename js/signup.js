import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore, collection, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

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

document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.navbar-toggle');
  const menu = document.querySelector('.navbar-menu');

  toggle.addEventListener('click', () => {
    menu.classList.toggle('active');
  });

  document.getElementById('signup-form').addEventListener('submit', e => {
    e.preventDefault();
    signup();
  });
});

function signup() {
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const role = document.getElementById('role').value;

  console.log("Signup attempt:", { name, email, password, role });

  if (!name || !email || !password || !role) {
    alert('Please fill in all fields');
    return;
  }

  if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
    alert('Please enter a valid email address');
    return;
  }

  createUserWithEmailAndPassword(auth, email, password).then(userCredential => {
    console.log("User created:", userCredential.user.uid);
    const user = userCredential.user;
    return setDoc(doc(db, 'users', email), {
      name,
      email,
      role
    });
  }).then(() => {
    console.log("User data saved to Firestore");
    alert('Sign up successful! Please sign in.');
    window.location.href = 'signin.html';
  }).catch(error => {
    console.error("Error:", error);
    alert('Error: ' + error.message);
  });
}