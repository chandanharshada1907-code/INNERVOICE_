const fs = require('fs');
let code = fs.readFileSync('script.js', 'utf8');

const oldCode = `                        loadDailyRecommendations();
}


    function getDate() {`;

const newCode = `                        loadDailyRecommendations();
                    } else {
                        showMessage(data.message || "Login failed");
                        loginButton.disabled = false;
                        loginButton.textContent = "Login";
                    }
                } catch(err) {
                    console.error("Login Error:", err);
                    showMessage("Error connecting to server. Please try again.");
                    loginButton.disabled = false;
                    loginButton.textContent = "Login";
                }
            });

    function getDate() {`;

code = code.replace(oldCode, newCode);
fs.writeFileSync('script.js', code);
console.log('Replaced successfully');
