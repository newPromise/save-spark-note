const vscode = require('vscode');
const nodemailer = require('nodemailer');
const fs = require('fs');
var workspace = vscode.workspace;
const window = vscode.window;
var settings = workspace.getConfiguration('savenote');
let activeEditor = window.activeTextEditor;
const { emailtype, emailsite, smtpport, smtppassword, emailtitle } = settings;

function activate(context) {
    let send = vscode.commands.registerCommand('extension.savenote', function () {
        window.onDidChangeActiveTextEditor(function (editor) {
            if (editor) {
                activeEditor = editor;
            }
        });
        const transporter = nodemailer.createTransport({
            service: emailtype,
            port: smtpport,
            secureConnection: true,
            auth: {
                user: emailsite,
                pass: smtppassword
            }
        });
        const path = activeEditor.document.uri.path;
        let emailFileName = path.includes("/") ? path.substr(path.lastIndexOf("/") + 1) : path;
        if (path) {
            fs.readFile(path, (data) => {
                var mailOptions = {
                    from: emailsite,
                    to: emailsite,
                    subject: emailtitle,
                    attachments: [
                        {
                            filename: emailFileName,
                            path
                        }
                    ]
                };
                transporter.sendMail(mailOptions, function(error, info){
                    if(error){
                        return console.log(error);
                    }
                    vscode.window.showInformationMessage("send success"); 
                });
            });
        }
    });
    context.subscriptions.push(send);
}

exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;