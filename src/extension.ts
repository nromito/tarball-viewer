// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { Tarball } from './tar';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(vscode.window.registerCustomEditorProvider('tarball-viewer.tarballPreview', new TarballEditorProvider));
}

class TarballEditorProvider implements vscode.CustomReadonlyEditorProvider<TarballListingDocument> {
	openCustomDocument(uri: vscode.Uri, openContext: vscode.CustomDocumentOpenContext, token: vscode.CancellationToken): TarballListingDocument | Thenable<TarballListingDocument> {
		return new TarballListingDocument(uri);
	}
	resolveCustomEditor(document: TarballListingDocument, webviewPanel: vscode.WebviewPanel, token: vscode.CancellationToken): void | Thenable<void> {
		return new Promise(async resolve => {
			webviewPanel.webview.html = `
			<!DOCTYPE html>
			<html lang="en">
			<body>
				<div>
					${(await document.getContent()).replace(/(?:\r\n|\n|\r)/g, '<br>')}
				</div>
			</body>
			</html>
			`;
			resolve();
		});
	}
}

class TarballListingDocument implements vscode.CustomDocument {
	private tarball: Tarball;
	constructor(readonly uri: vscode.Uri) {
		this.tarball = new Tarball(uri.fsPath);
	}
	dispose(): void {
		// TODO
	}
	public async getContent(): Promise<string> {
		const listing = await this.tarball.listContent();
		return listing.join('\n');
	}
}

// this method is called when your extension is deactivated
export function deactivate() {}
