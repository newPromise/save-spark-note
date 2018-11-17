const vscode = require('vscode');
const nodemailer = require('nodemailer');
const fs = require('fs');
const workspace = vscode.workspace;
const window = vscode.window;
let settings = workspace.getConfiguration('savenote');
let activeEditor = window.activeTextEditor;
let { emailtype, emailsite, smtpport, smtppassword, emailtitle } = settings;
const supportEmail = ["qq"];
const info = {
    success: (msg) => {
        window.showInformationMessage(msg);
    },
    error: (msg) => {
        window.showErrorMessage(msg);
    },
    warning: (msg) => {
        window.showWarningMessage(msg);
    }
};

const testEmail = (email) => {
    if (!/^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/.test(email)) {
        info.warning("the email site is not correct");
        return false;
    } else {
        return true;
    }
};



function activate(context) {
    workspace.onDidChangeConfiguration(function () {
        settings = workspace.getConfiguration('savenote');
        emailsite = settings.get("emailsite");
        emailtype = settings.get("emailtype");
        emailtitle = settings.get("emailtitle");
        smtppassword = settings.get("smtppassword");
        smtpport = settings.get("smtpport");
    });
    let send = vscode.commands.registerCommand('extension.savenote', function () {
        if (!testEmail(emailsite)) return;
        if (!supportEmail.includes(emailtype)) {
            info.warning(`emailtype ${emailtype} is not support`);
            return;
        }
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
                transporter.sendMail(mailOptions, function(error, msg){
                    if(error){
                        info.error(`${error}`);
                        info.warning("check your email site and smtp password is correct");
                        return;
                    }
                    info.success(`save note to email<${emailsite}> success`);
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