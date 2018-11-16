const vscode = require('vscode');
const nodemailer = require('nodemailer');
const fs = require('fs');
var workspace = vscode.workspace;
var settings = workspace.getConfiguration('savenote');
const { emailtype, emailsite, smtpport, smtppassword, emailtitle } = settings;
// psiqbvilarbocaij

function activate(context) {
    let send = vscode.commands.registerCommand('extension.savenote', function () {
        var transporter = nodemailer.createTransport({
            service: emailtype,
            port: smtpport, // SMTP 端口
            secureConnection: true, // 使用 SSL
            auth: {
                user: emailsite,
                pass: smtppassword
            }
        });
        const path = vscode.window.visibleTextEditors[0].document.uri.path;
        let emailFileName = path.includes("/") ? path.substr(path.lastIndexOf("/") + 1) : path;
        if (path) {
            fs.readFile(path, () => {
                var mailOptions = {
                    from: emailsite, // 发件地址
                    to: emailsite, // 收件列表
                    subject: emailtitle, // 标题
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
                    vscode.window.showInformationMessage("发送成功"); 
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