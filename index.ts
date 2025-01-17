#!/usr/bin/env node
import prompts from "prompts";
import path from "path";
import { installDependencies } from "./helpers/core/dependenciesInstaller.js";
import { existsSync } from "fs";
import { mkdir } from "./helpers/utils/mkdir.js";
import { getProjectFiles } from "./helpers/core/getProjectFiles.js";
import { selfDestroy, setRoot } from "./helpers/core/selfDestroy.js";
import chalk from "chalk";
import { logInstructions } from "./helpers/core/logInstructions.js";
import context from "./helpers/core/context.js";

import { checkNewPackageUpdates } from "./helpers/utils/checkNewPackageUpdates.js";

import { smartContractWizard } from "./helpers/smartContractsWizard/smartContractWizard.js";
import { buildSmartContract } from "./helpers/smartContractsWizard/smartContractBuilder.js";
import {
	getModulesInCathegory,
	selectModulesInCathegory,
} from "./helpers/utils/getModulesInCathegory.js";

console.log(
	chalk.blue(`
MMMMMMMMMMMMMMMMMK:..:KMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMMWO,    ,OWMMMMMMMMMMMMMMM
MMMMMMMMMMMMMMWk'      'kWMMMMMMMMMMMMMM
MMMMMMMMMMMMMMK;        .dNMMMMMMMMMMMMM
MMMMMMMMMMMMMMWk'        .lXMMMMMMMMMMMM
MMMMMMMMMMMKdxNW0;        .cKMMMMMMMMMMM
MMMMMMMMMW0; .cXMK:.        ;0WMMMMMMMMM
MMMMMMMMWk'    :0WXl'.       ,kWMMMMMMMM
MMMMMMMNx.      ,0MNKd.       .xNMMMMMMM
MMMMMMNo.       'OMMMWx'       .oNMMMMMM
MMMMMXc.       ,OWMMMMWO;........dNMMMMM
MMMM0:        :0MMMMMMMMN0OO0OOO0XWMMMMM
MMWO,       .cXMXkxxxxxxxxxxxxxxxxxkKWMM
MWx'       .oNW0;.                  'xWM
Nd.       .xNWk'                     .dN
l.       'kWNx.                       .l
.       .kWM0'                         .
`)
);

console.log("\n");
console.log("🔵 Welcome to the create-web3-dapp wizard 🔵");
console.log("\n");

let projectPath = "";

// Gets project name

// Starts creation process
async function run() {
	let step = 0;
	let quit = false;

	await checkNewPackageUpdates();

	while (!quit) {
		switch (step) {
			case 0:
				try {
					projectPath = "";
					// Checks if project name is provided
					if (typeof projectPath === "string") {
						projectPath = projectPath.trim();
					}
					while (!projectPath) {
						projectPath = await prompts({
							type: "text",
							name: "projectPath",
							message: "Please, insert a project name",
							initial: "my-dapp",
						}).then((data) => data.projectPath);
					}

					//Reformat project's name
					projectPath = projectPath.trim().replace(/[\W_]+/g, "-");
					context.resolvedProjectPath = path.resolve(projectPath);
					let dirExists: boolean = existsSync(
						context.resolvedProjectPath
					);

					let i = 1;
					// Check if project
					while (dirExists) {
						projectPath = await prompts({
							type: "text",
							name: "projectPath",
							message:
								"A directory with this name already exists, please use a different name",
							initial: `my-dapp-${i}`,
						}).then((data) =>
							data.projectPath.trim().replace(/[\W_]+/g, "-")
						);
						context.resolvedProjectPath = path.resolve(projectPath);
						dirExists = existsSync(context.resolvedProjectPath);
						i += 1;
					}
					context.projectName = path.basename(
						context.resolvedProjectPath
					);
					setRoot(context.resolvedProjectPath);
				} catch (e) {
					selfDestroy(e);
				}
				step++;
				break;
			case 1:
				try {
					const builderTemplate: string = await prompts({
						type: "select",
						name: "builderTemplate",
						message: "Choose how to start:",
						choices: [
							{
								title: "Create a default EVM application",
								value: "evm_app",
							},
							{
								title: "Create a default Solana application",
								value: "sol_app",
							},
							{
								title: "Create a custom application",
								value: "custom",
							},
							{
								title: "Back",
								value: "back",
							},
						],
						initial: 0,
						hint: "- Create a default app ",
					}).then((data) => data.builderTemplate);

					if (builderTemplate == "evm_app") {
						context.dappInfo.chain = "ethereum";
						context.dappInfo.isEVM = true;
						context.dappInfo.isTestnet = true;
						context.dappInfo.testnet = "goerli";

						step = 5;
					} else if (builderTemplate == "sol_app") {
						context.dappInfo.chain = "solana";
						context.dappInfo.isEVM = false;
						context.dappInfo.isTestnet = false;
						context.dappInfo.testnet = "devnet";

						step = 5;
					} else if (builderTemplate == "custom") {
						step++;
						break;
					} else if (builderTemplate == "back") {
						step--;
						break;
					}
				} catch (e) {
					selfDestroy(e);
				}
				break;
			case 2:
				await prompts({
					type: "select",
					name: "chain",
					message: "For which VM are you building for?",
					choices: [
						{ title: "Ethereum", value: "ethereum" },
						{ title: "Polygon", value: "polygon" },
						{ title: "Artbitrum", value: "arbitrum" },
						{ title: "Optimism", value: "optimism" },
						{ title: "Solana", value: "solana" },
						{ title: "Back", value: "back" },
					],
					initial: 0,
					hint: "- This will make sure to copy the right dependencies and template files",
				}).then((data) => (context.dappInfo.chain = data.chain));
				if (context.dappInfo.chain == "back") {
					step--;
					break;
				}

				context.dappInfo.isEVM =
					context.dappInfo.chain == "ethereum" ||
					context.dappInfo.chain == "polygon" ||
					context.dappInfo.chain == "arbitrum" ||
					context.dappInfo.chain == "optimism"
						? true
						: false;
				step++;
				break;

			case 3:
				try {
					if (
						context.dappInfo.chain === "ethereum" ||
						context.dappInfo.chain === "polygon"
					) {
						const isTestnet: boolean | string = await prompts({
							type: "select",
							name: "testnet",
							message: "Do you want to use a testnet?",
							choices: [
								{
									title: "Yes",
									value: true,
								},
								{ title: "No", value: false },
								{ title: "Back", value: "back" },
							],
							initial: 0,
							hint: "- You can change it later",
						}).then((data) => data.testnet);
						if (typeof isTestnet == "string") {
							step--;
							break;
						} else {
							context.dappInfo.isTestnet = isTestnet;
							if (isTestnet) {
								switch (context.dappInfo.chain) {
									case "ethereum":
										context.dappInfo.testnet = "goerli";
										break;
									case "polygon":
										context.dappInfo.testnet = "mumbai";
								}
							}
						}
					}
					step++;
				} catch (e) {
					selfDestroy(e);
				}

				break;
			case 4:
				try {
					if (context.dappInfo.chain !== "solana") {
						await prompts({
							type: "select",
							name: "toolkitType",
							message: "What kind of DApp are you building?",
							choices: [
								{ title: "NFTs", value: "nfts" },
								{
									title: "DeFi (coming soon)",
									value: undefined,
									disabled: true,
								},
								{
									title: "Governance (coming soon)",
									value: undefined,
									disabled: true,
								},
								{ title: "Blank", value: undefined },
								{ title: "Back", value: "back" },
							],
							initial: 0,
							hint: "- Select Blank to start from scratch",
						}).then(
							(data) =>
								(context.dappInfo.toolkitType =
									data.toolkitType)
						);

						if (
							context.dappInfo.toolkitType &&
							typeof context.dappInfo.toolkitType === "string"
						) {
							if (context.dappInfo.toolkitType == "back") {
								step--;
								break;
							}

							const modules = getModulesInCathegory(
								context.dappInfo.toolkitType
							);

							await prompts({
								type: "multiselect",
								name: "modules",
								message: "Import template react components",
								choices: [...modules],
								hint: "- Space to select. Return to submit",
							}).then(
								(data) =>
									(context.dappInfo.modules = data.modules)
							);
							const continueComponentSelection = await prompts({
								type: "toggle",
								name: "continueComponentSelection",
								message: "Confirm components selection?",
								initial: true,
								active: "yes",
								inactive: "no",
							}).then((data) => data.continueComponentSelection);
							if (!continueComponentSelection) {
								if (
									context.dappInfo.toolkitType &&
									context.dappInfo.modules
								) {
									selectModulesInCathegory(
										context.dappInfo.toolkitType,
										context.dappInfo.modules
									);
								}
								break;
							}
						}
					}
					if (
						context.dappInfo.toolkitType &&
						context.dappInfo.modules
					) {
						selectModulesInCathegory(
							context.dappInfo.toolkitType,
							context.dappInfo.modules
						);
					}

					step++;
				} catch (e) {
					selfDestroy(e);
				}

				break;
			case 5:
				try {
					let useBackend;
					if (context.dappInfo.chain == "solana") {
						useBackend = await prompts({
							type: "select",
							name: "useBackend",
							message: "Do you want to import Anchor?",
							choices: [
								{
									title: "Yes",
									description:
										"This option has a description",
									value: true,
								},
								{ title: "No", value: false },
								{ title: "Back", value: "back" },
							],
							initial: 0,
							hint: "- This will install the needed dependencies to your project",
						}).then((data) => data.useBackend);
						if (typeof useBackend == "string") {
							step--;
							break;
						} else {
							context.dappInfo.backendProvider = "anchor";
						}
					} else {
						useBackend = await prompts({
							type: "select",
							name: "useBackend",
							message:
								"Do you want to import a Blockchain development environment? (Hardhat, Foundry)",
							choices: [
								{
									title: "Yes",
									description:
										"This option has a description",
									value: true,
								},
								{ title: "No", value: false },
								{ title: "Back", value: "back" },
							],
							initial: 0,
							hint: "- This will install the needed dependencies to your project",
						}).then((data) => data.useBackend);
						if (typeof useBackend == "string") {
							step--;
							break;
						}
						context.dappInfo.useBackend = useBackend;

						if (context.dappInfo.useBackend) {
							const backendProvider = await prompts({
								type: "select",
								name: "backendProvider",
								message:
									"Choose a Blockchain development environment:",
								choices: [
									{ title: "Hardhat", value: "hardhat" },
									{
										title: "Foundry (not yet supported)",
										value: "foundry",
										disabled: true,
									},
									{ title: "Back", value: "back" },
								],
								initial: 0,
							}).then((data) => data.backendProvider);
							if (backendProvider == "back") {
								break;
							}
							context.dappInfo.backendProvider = backendProvider;

							const hasContract: boolean = await prompts({
								type: "select",
								name: "hasContract",
								message:
									"Do you want to create a new contract?",
								choices: [
									{
										title: "Yes",
										description:
											"This will start the smart contract creation wizard",
										value: true,
									},
									{ title: "No", value: false },
									{ title: "Back", value: "back" },
								],
								initial: 0,
								hint: "- This will install the needed dependencies to your project",
							}).then((data) => data.hasContract);

							context.dappInfo.hasSmartContract = hasContract;
							if (hasContract) {
								context.contractInfo =
									await smartContractWizard();
							}
						}
					}

					step++;
				} catch (e) {
					selfDestroy(e);
				}

				break;
			case 6:
				try {
					const alchemyAPIKey: string = await prompts({
						type: "text",
						name: "apiKey",
						message:
							"Insert your Alchemy API Key (from https://dashboard.alchemy.com -- default: 'demo')",
						initial: "demo",
					}).then((data) => data.apiKey);

					context.dappInfo.alchemyAPIKey = alchemyAPIKey;

					quit = true;
				} catch (e) {
					selfDestroy(e);
				}

				break;
		}
	}

	try {
		mkdir(context.resolvedProjectPath);
		getProjectFiles(context);

		if (context.contractInfo) {
			buildSmartContract(context.contractInfo);
		}

		await installDependencies(context);
		logInstructions(context.dappInfo.useBackend);
	} catch (e) {
		selfDestroy(e);
	}
}

run();
