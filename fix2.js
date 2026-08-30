const fs = require('fs');
let code = fs.readFileSync('script.js', 'utf8');

const regex = /loadDailyRecommendations\(\);\s*\}\s*function getDate\(\) \{/;

const newCode = `loadDailyRecommendations();
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

if (regex.test(code)) {
    code = code.replace(regex, newCode);
    fs.writeFileSync('script.js', code);
    console.log('Replaced using regex successfully');
} else {
    console.log('Regex did NOT match');
}
