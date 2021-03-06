var RLC                = artifacts.require("../node_modules/rlc-faucet-contract/contracts/RLC.sol");
var IexecODBLibOrders  = artifacts.require("./IexecODBLibOrders.sol");
// var ECDSA              = artifacts.require("./ECDSA.sol");
var IexecHub           = artifacts.require("./IexecHub.sol");
var IexecClerk         = artifacts.require("./IexecClerk.sol");
var AppRegistry        = artifacts.require("./AppRegistry.sol");
var DatasetRegistry    = artifacts.require("./DatasetRegistry.sol");
var WorkerpoolRegistry = artifacts.require("./WorkerpoolRegistry.sol");
var Relay              = artifacts.require("./Relay.sol");
var Broker             = artifacts.require("./Broker.sol");
var SMSDirectory       = artifacts.require("./SMSDirectory.sol");

const fs = require("fs-extra");

module.exports = async function(deployer, network, accounts)
{
	console.log("# web3 version:", web3.version);
	chainid   = await web3.eth.net.getId();
	chaintype = await web3.eth.net.getNetworkType()
	console.log("Chainid is:", chainid);
	console.log("Chaintype is:", chaintype);

	switch (chaintype)
	{
		case "kovan":
			RLCInstance = await RLC.at("0xc57538846ec405ea25deb00e0f9b29a432d53507")
			owner = null;
			break;

		case "rinkeby":
			RLCInstance = await RLC.at("0xf1e6ad3a7ef0c86c915f0fedf80ed851809bea90")
			owner = null;
			break;

		case "ropsten":
			RLCInstance = await RLC.at("0x7314dc4d7794b5e7894212ca1556ae8e3de58621")
			owner = null;
			break;

		case "mainnet":
			RLCInstance = await RLC.at("0x607F4C5BB672230e8672085532f7e901544a7375")
			owner = null;
			break;

		case "private":
			await deployer.deploy(RLC);
			RLCInstance = await RLC.deployed();
			console.log("RLC deployed at address: " + RLCInstance.address);
			owner = await RLCInstance.owner.call()
			console.log("RLC faucet wallet is " + owner);
			console.log("RLC faucet supply is " + await RLCInstance.balanceOf(owner));
			break;

		default:
			console.log("[ERROR] Migration to chaintype " + chaintype + " is not configured");
			return 1;
			break;
	}

	await deployer.deploy(IexecODBLibOrders);
	await deployer.link(IexecODBLibOrders, IexecClerk);
	// await deployer.deploy(ECDSA);
	// await deployer.link(ECDSA, IexecClerk);
	// await deployer.link(ECDSA, IexecHub);

	await deployer.deploy(IexecHub);
	IexecHubInstance = await IexecHub.deployed();
	console.log("IexecHub deployed at address: " + IexecHubInstance.address);

	await deployer.deploy(IexecClerk, RLCInstance.address, IexecHubInstance.address, chainid);
	IexecClerkInstance = await IexecClerk.deployed();
	console.log("IexecClerk deployed at address: " + IexecClerkInstance.address);

	await deployer.deploy(AppRegistry);
	await deployer.deploy(DatasetRegistry);
	await deployer.deploy(WorkerpoolRegistry);
	AppRegistryInstance        = await AppRegistry.deployed();
	DatasetRegistryInstance    = await DatasetRegistry.deployed();
	WorkerpoolRegistryInstance = await WorkerpoolRegistry.deployed();
	console.log("AppRegistry        deployed at address: " + AppRegistryInstance.address);
	console.log("DatasetRegistry    deployed at address: " + DatasetRegistryInstance.address);
	console.log("WorkerpoolRegistry deployed at address: " + WorkerpoolRegistryInstance.address);
	// transferOwnership if ownable

	await IexecHubInstance.attachContracts(
		IexecClerkInstance.address
	, AppRegistryInstance.address
	, DatasetRegistryInstance.address
	, WorkerpoolRegistryInstance.address
	);
	console.log("attach Contracts to IexecHub done");

	var categoriesConfigFileJson = JSON.parse(fs.readFileSync("./config/categories.json"));
	for(var i = 0; i < categoriesConfigFileJson.categories.length; ++i)
	{
		console.log("create category : " + categoriesConfigFileJson.categories[i].name);
		await IexecHubInstance.createCategory(
			categoriesConfigFileJson.categories[i].name
		,	JSON.stringify(categoriesConfigFileJson.categories[i].description)
		,	categoriesConfigFileJson.categories[i].workClockTimeRef
		);
	}
	console.log("countCategory is now: " + await IexecHubInstance.countCategory());

	await IexecHubInstance.transferOwnership(owner);
	console.log("setCategoriesCreator to " + owner);

	// experimental, do not deploy
	if (chaintype == "private")
	{
		await deployer.deploy(Relay);
		await deployer.deploy(Broker, IexecClerkInstance.address);
		await deployer.deploy(SMSDirectory);
		RelayInstance        = await Relay.deployed();
		BrokerInstance       = await Broker.deployed();
		SMSDirectoryInstance = await SMSDirectory.deployed();
		console.log("Relay deployed at address: " + RelayInstance.address);
		console.log("Broker deployed at address: " + BrokerInstance.address);
		console.log("SMSDirectory deployed at address: " + SMSDirectoryInstance.address);
	}

};
