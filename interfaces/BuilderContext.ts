import { SmartContractInfo } from "../interfaces/smartContractInfo.js";
import { ERC721smartContractInfo } from "../interfaces/ERC721smartContractInfo.js";
import { ERC20smartContractInfo } from "./ERC20smartContractInfo.js";
import { DappInfo } from "./dappInfo.js";

export interface BuilderContext {
	contractInfo:
		| SmartContractInfo
		| ERC721smartContractInfo
		| ERC20smartContractInfo
		| undefined;
	dappInfo: DappInfo;
	projectName: string;
	resolvedProjectPath: string;
}


export default BuilderContext;
