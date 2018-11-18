const vscode = require('vscode');
const nodemailer = require('nodemailer');
const fs = require('fs');
const { join } = require('path');
const { workspace, window, Uri, Position } = vscode;
let settings = workspace.getConfiguration('savenote');
let activeEditor = window.activeTextEditor;
let { emailtype, emailsite, smtpport, smtppassword, emailtitle, saveFragDir, saveFragFileName, saveFragFileType } = settings;
const supportEmail = ["qq"];
const supportSaveFileTypes = ["md"];
let noteFileUri = null;
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

const createFileUri = (dir, filename= "") => {
    return new Promise((resolve) => {
        const filepath = join(dir, filename);
        resolve(Uri.file(filepath));
    });
}



function activate(context) {
    workspace.onDidChangeConfiguration(function () {
        settings = workspace.getConfiguration('savenote');
        emailsite = settings.get("emailsite");
        emailtype = settings.get("emailtype");
        emailtitle = settings.get("emailtitle");
        smtppassword = settings.get("smtppassword");
        smtpport = settings.get("smtpport");
        saveFragDir = settings.get("saveFragDir");
        saveFragFileName = settings.get("saveFragFileName");
        saveFragFileType = settings.get("saveFragFileType")
    });
    window.onDidChangeActiveTextEditor(function (editor) {
        if (editor) {
            activeEditor = editor;
        }
    });
    let send = vscode.commands.registerCommand('extension.savenote', function () {
        if (!testEmail(emailsite)) return;
        if (!supportEmail.includes(emailtype)) {
            info.warning(`emailtype ${emailtype} is not support`);
            return;
        }
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
            fs.readFile(path, () => {
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
                transporter.sendMail(mailOptions, function(error){
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
    const saveFragment = vscode.commands.registerCommand("extension.saveFragment", function () {
        if (!supportSaveFileTypes.includes(saveFragFileType)) {
            info.warning(`save file type ${ saveFragFileType } not support`);
            return;
        }
        const startPos = activeEditor.selections[0].start;
        const endPos = activeEditor.selections[0].end;
        const range = new vscode.Range(new Position(startPos.line, startPos.character), new Position(endPos.line, endPos.character));
        const text = activeEditor.document.getText(range);
        const codeType = activeEditor.document.languageId;
        let fileEdit = new vscode.WorkspaceEdit();
        if (text.length === 0) return;
        createFileUri(saveFragDir, saveFragFileName).then((uri) => {
            fileEdit.createFile(uri);
            workspace.applyEdit(fileEdit);
            noteFileUri = uri;
            window.showTextDocument(uri).then(editor => {
                const lineCount = editor.document.lineCount;
                editor.edit(bulider => {
                    bulider.replace(new Position(lineCount - 1, 0),  "```" + codeType + "\n" + text + "\n```\n");
                });
            });
        }, (err) => {
            info.error(err);
        })
    });
    context.subscriptions.push(saveFragment);
    context.subscriptions.push(send);
}

exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;