let types = {
	EIP712Domain: [
		{ name: "name",              type: "string"  },
		{ name: "version",           type: "string"  },
		{ name: "chainId",           type: "uint256" },
		{ name: "verifyingContract", type: "address" },
	],
	DappOrder: [
		{ name: "dapp",         type: "address" },
		{ name: "dappprice",    type: "uint256" },
		{ name: "volume",       type: "uint256" },
		{ name: "datarestrict", type: "address" },
		{ name: "poolrestrict", type: "address" },
		{ name: "userrestrict", type: "address" },
		{ name: "salt",         type: "bytes32" }
	],
	DataOrder: [
		{ name: "data",         type: "address" },
		{ name: "dataprice",    type: "uint256" },
		{ name: "volume",       type: "uint256" },
		{ name: "dapprestrict", type: "address" },
		{ name: "poolrestrict", type: "address" },
		{ name: "userrestrict", type: "address" },
		{ name: "salt",         type: "bytes32" }
	],
	PoolOrder: [
		{ name: "pool",         type: "address" },
		{ name: "poolprice",    type: "uint256" },
		{ name: "volume",       type: "uint256" },
		{ name: "category",     type: "uint256" },
		{ name: "trust",        type: "uint256" },
		{ name: "tag",          type: "uint256" },
		{ name: "dapprestrict", type: "address" },
		{ name: "datarestrict", type: "address" },
		{ name: "userrestrict", type: "address" },
		{ name: "salt",         type: "bytes32" }
	],
	UserOrder: [
		{ name: "dapp",         type: "address" },
		{ name: "dappmaxprice", type: "uint256" },
		{ name: "data",         type: "address" },
		{ name: "datamaxprice", type: "uint256" },
		{ name: "pool",         type: "address" },
		{ name: "poolmaxprice", type: "uint256" },
		{ name: "requester",    type: "address" },
		{ name: "volume",       type: "uint256" },
		{ name: "category",     type: "uint256" },
		{ name: "trust",        type: "uint256" },
		{ name: "tag",          type: "uint256" },
		{ name: "beneficiary",  type: "address" },
		{ name: "callback",     type: "address" },
		{ name: "params",       type: "string"  },
		{ name: "salt",         type: "bytes32" }
	],
}

function dependencies(primaryType, found = [])
{
	if (found.includes(primaryType))
		return found;
	if (types[primaryType] === undefined)
		return found;
	found.push(primaryType);
	for (let field of types[primaryType])
		for (let dep of dependencies(field.type, found))
			if (!found.includes(dep))
				found.push(dep);
	return found;
}

function encodeType(primaryType)
{
	// Get dependencies primary first, then alphabetical
	let deps = dependencies(primaryType);
	deps = deps.filter(t => t != primaryType);
	deps = [primaryType].concat(deps.sort());

	// Format as a string with fields
	let result = "";
	for (let type of deps)
	{
			result += `${type}(${types[type].map(({ name, type }) => `${type} ${name}`).join(",")})`;
	}
	return result;
}

function typeHash(primaryType)
{
	return ethUtil.sha3(encodeType(primaryType));
}

function encodeData(primaryType, data)
{
	let encTypes  = [];
	let encValues = [];
	// Add typehash
	encTypes.push("bytes32");
	encValues.push(typeHash(primaryType));
	// Add field contents
	for (let field of types[primaryType])
	{
			let value = data[field.name];
			if (field.type == "string" || field.type == "bytes")
			{
					encTypes.push("bytes32");
					value = ethUtil.sha3(value);
					encValues.push(value);
			}
			else if (types[field.type] !== undefined)
			{
					encTypes.push("bytes32");
					value = ethUtil.sha3(encodeData(field.type, value));
					encValues.push(value);
			}
			else if (field.type.lastIndexOf("]") === field.type.length - 1)
			{
					throw "TODO: Arrays currently unimplemented in encodeData";
			}
			else
			{
					encTypes.push(field.type);
					encValues.push(value);
			}
	}
	// console.log(">>1", encTypes);
	// console.log(">>2", encValues);
	return abi.rawEncode(encTypes, encValues);
}

function structHash(primaryType, data)
{
	return ethUtil.sha3(encodeData(primaryType, data));
}

function signHash()
{
	return ethUtil.sha3(
		Buffer.concat([
			Buffer.from("1901", "hex"),
			structHash("EIP712Domain", typedData.domain),
			structHash(typedData.primaryType, typedData.message),
		]),
	);
}















var RLC          = artifacts.require("../node_modules/rlc-token//contracts/RLC.sol");
var IexecHub     = artifacts.require("./IexecHub.sol");
var IexecClerk   = artifacts.require("./IexecClerk.sol");
var DappRegistry = artifacts.require("./DappRegistry.sol");
var DataRegistry = artifacts.require("./DataRegistry.sol");
var PoolRegistry = artifacts.require("./PoolRegistry.sol");
var Dapp         = artifacts.require("./Dapp.sol");
var Data         = artifacts.require("./Data.sol");
var Pool         = artifacts.require("./Pool.sol");
var Beacon       = artifacts.require("./Beacon.sol");
var Broker       = artifacts.require("./Broker.sol");

var IexecODBLibOrders = artifacts.require("./IexecODBLibOrders.sol");
var TestContract      = artifacts.require("./TestContract.sol");

const ethers    = require("ethers"); // for ABIEncoderV2
const constants = require("./constants");
const odbtools  = require("../utils/odb-tools");

const ethUtil   = require("ethereumjs-util");
const abi       = require("ethereumjs-abi");


var RLCInstance          = null;
var IexecHubInstance     = null;
var IexecClerkInstance   = null;
var DappRegistryInstance = null;
var DataRegistryInstance = null;
var PoolRegistryInstance = null;
var BeaconInstance       = null;
var BrokerInstance       = null;
var DappInstance         = null;
var DataInstance         = null;
var PoolInstance         = null;
var TestInstance         = null;
var TestEthersInstance   = null;

var domain    = null;
var dapporder = null;
var dataorder = null;
var poolorder = null;
var userorder = null;

var privateKeys = {
	"0x7bd4783fdcad405a28052a0d1f11236a741da593": "0x564a9db84969c8159f7aa3d5393c5ecd014fce6a375842a45b12af6677b12407",
	"0xdfa2585c16caf9c853086f36d2a37e9b8d1eab87": "0xde43b282c2931fc41ca9e1486fedc2c45227a3b9b4115c89d37f6333c8816d89",
	"0xbc11bf07a83c7e04daef3dd5c6f9a046f8c5fa7b": "0xfb9d8a917d85d7d9a052745248ecbf6a2268110945004dd797e82e8d4c071e79",
	"0x2d29bfbec903479fe4ba991918bab99b494f2bef": "0x2a46e8c1535792f6689b10d5c882c9363910c30751ec193ae71ec71630077909",
	"0x748e091bf16048cb5103e0e10f9d5a8b7fbdd860": "0xf26f9219bde27cc44b578268852e9745cd465653b554ae6ff2e6f037e68d00a0",
	"0x892407e8e2440def7a8854ab0a936d94784d658f": "0x3b4930efee657739a4bec2eb1785920a13d861b052555b1f24e4710716a31fe0",
	"0x6e741c5bcd85d027260f9a24d171525e0ea5f497": "0xf5b8d40ba60c8c5d6bc7e57e30c531dc0197bf74a8ab305956dc3a2500da5647",
	"0x4962930004739a3bc8d849a528fbbffebd9c193b": "0x5c45629b930885efbacc578a3fdb65a84808ab2cad81cccab9721a898a026afb",
	"0x0ad5797bc72f14430e4887c2bc6f9b478107b9d3": "0x99b028c43624ddbee330574a18334a0b77000a527bb836e17b778e7b87d0ad6f",
	"0x9a43bb008b7a657e1936ebf5d8e28e5c5e021596": "0x2d56307fa167c72a88b1a417bf9dde36b68839fdb674115c48a29f184a6b7304",
};
addressToPrivate = function(account) { return Buffer.from(privateKeys[account.toLowerCase()].substring(2), 'hex') };



function extractEvents(txMined, address, name) { return txMined.logs.filter((ev) => { return ev.address == address && ev.event == name }); }

contract("IexecHub", async (accounts) => {

	assert.isAtLeast(accounts.length, 10, "should have at least 10 accounts");
	let iexecAdmin    = accounts[0];
	let dappProvider  = accounts[1];
	let dataProvider  = accounts[2];
	let poolScheduler = accounts[3];
	let poolWorker1   = accounts[4];
	let poolWorker2   = accounts[5];
	let poolWorker3   = accounts[6];
	let poolWorker4   = accounts[7];
	let user          = accounts[8];
	let sgxEnclave    = accounts[9];

	before("configure", async () => {
		console.log("# web3 version:", web3.version);

		RLCInstance          = await RLC.deployed();
		IexecHubInstance     = await IexecHub.deployed();
		IexecClerkInstance   = await IexecClerk.deployed();
		DappRegistryInstance = await DappRegistry.deployed();
		DataRegistryInstance = await DataRegistry.deployed();
		PoolRegistryInstance = await PoolRegistry.deployed();
		BeaconInstance       = await Beacon.deployed();
		BrokerInstance       = await Broker.deployed();

		TestInstance              = await TestContract.deployed();
		IexecODBLibOrdersInstance = await IexecODBLibOrders.deployed()

		jsonRpcProvider                 = new ethers.providers.JsonRpcProvider();
		TestEthersInstance              = new ethers.Contract(TestInstance.address,              TestContract.abi,      jsonRpcProvider);
		IexecODBLibOrdersEthersInstance = new ethers.Contract(IexecODBLibOrdersInstance.address, IexecODBLibOrders.abi, jsonRpcProvider);
	});

	it("initiate resources", async () => {
		txMined = await DappRegistryInstance.createDapp(dappProvider, "R Clifford Attractors", constants.DAPP_PARAMS_EXAMPLE, constants.NULL.BYTES32, { from: dappProvider });
		assert.isBelow(txMined.receipt.gasUsed, constants.AMOUNT_GAS_PROVIDED, "should not use all gas");
		events = extractEvents(txMined, DappRegistryInstance.address, "CreateDapp");
		DappInstance = await Dapp.at(events[0].args.dapp);

		txMined = await DataRegistryInstance.createData(dataProvider, "Pi", "3.1415926535", constants.NULL.BYTES32, { from: dataProvider });
		assert.isBelow(txMined.receipt.gasUsed, constants.AMOUNT_GAS_PROVIDED, "should not use all gas");
		events = extractEvents(txMined, DataRegistryInstance.address, "CreateData");
		DataInstance = await Data.at(events[0].args.data);

		txMined = await PoolRegistryInstance.createPool(poolScheduler, "A test workerpool", 10, 10, 10, { from: poolScheduler });
		assert.isBelow(txMined.receipt.gasUsed, constants.AMOUNT_GAS_PROVIDED, "should not use all gas");
		events = extractEvents(txMined, PoolRegistryInstance.address, "CreatePool");
		PoolInstance = await Pool.at(events[0].args.pool);
	});

	it("write orders", async () => {
		domain = {
			name:              "iExecODB",
			version:           "3.0-alpha",
			chainId:           1,
			verifyingContract: TestInstance.address,
		};
		dapporder = {
			dapp:         DappInstance.address,
			dappprice:    3,
			volume:       1000,
			datarestrict: constants.NULL.ADDRESS,
			poolrestrict: constants.NULL.ADDRESS,
			userrestrict: constants.NULL.ADDRESS,
			salt:         web3.utils.randomHex(32),
			sign:         constants.NULL.SIGNATURE,
		};
		dataorder = {
			data:         DataInstance.address,
			dataprice:    1,
			volume:       1000,
			dapprestrict: constants.NULL.ADDRESS,
			poolrestrict: constants.NULL.ADDRESS,
			userrestrict: constants.NULL.ADDRESS,
			salt:         web3.utils.randomHex(32),
			sign:         constants.NULL.SIGNATURE,
		};
		poolorder = {
			pool:         PoolInstance.address,
			poolprice:    25,
			volume:       3,
			category:     4,
			trust:        1000,
			tag:          0,
			dapprestrict: constants.NULL.ADDRESS,
			datarestrict: constants.NULL.ADDRESS,
			userrestrict: constants.NULL.ADDRESS,
			salt:         web3.utils.randomHex(32),
			sign:         constants.NULL.SIGNATURE,
		}
		userorder = {
			dapp:         DappInstance.address,
			dappmaxprice: 3,
			data:         DataInstance.address,
			datamaxprice: 1,
			pool:         constants.NULL.ADDRESS,
			poolmaxprice: 25,
			volume:       1,
			category:     4,
			trust:        1000,
			tag:          0,
			requester:    user,
			beneficiary:  user,
			callback:     constants.NULL.ADDRESS,
			params:       "<parameters>",
			salt:         web3.utils.randomHex(32),
			sign:         constants.NULL.SIGNATURE,
		};
	});

	it("compute type hashes", async () => {
		assert.equal(encodeType("EIP712Domain"), "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)",                                                                                                                                                                           "[ERROR] domain type encode"   );
		assert.equal(encodeType("DappOrder"   ), "DappOrder(address dapp,uint256 dappprice,uint256 volume,address datarestrict,address poolrestrict,address userrestrict,bytes32 salt)",                                                                                                                         "[ERROR] dapporder type encode");
		assert.equal(encodeType("DataOrder"   ), "DataOrder(address data,uint256 dataprice,uint256 volume,address dapprestrict,address poolrestrict,address userrestrict,bytes32 salt)",                                                                                                                         "[ERROR] dataorder type encode");
		assert.equal(encodeType("PoolOrder"   ), "PoolOrder(address pool,uint256 poolprice,uint256 volume,uint256 category,uint256 trust,uint256 tag,address dapprestrict,address datarestrict,address userrestrict,bytes32 salt)",                                                                              "[ERROR] poolorder type encode");
		assert.equal(encodeType("UserOrder"   ), "UserOrder(address dapp,uint256 dappmaxprice,address data,uint256 datamaxprice,address pool,uint256 poolmaxprice,address requester,uint256 volume,uint256 category,uint256 trust,uint256 tag,address beneficiary,address callback,string params,bytes32 salt)", "[ERROR] userorder type encode");

		assert.equal(ethUtil.bufferToHex(typeHash("EIP712Domain")), odbtools.EIP712DOMAIN_TYPEHASH, "[ERROR] domain type hash"   );
		assert.equal(ethUtil.bufferToHex(typeHash("DappOrder"   )), odbtools.DAPPORDER_TYPEHASH,    "[ERROR] dapporder type hash");
		assert.equal(ethUtil.bufferToHex(typeHash("DataOrder"   )), odbtools.DATAORDER_TYPEHASH,    "[ERROR] dataorder type hash");
		assert.equal(ethUtil.bufferToHex(typeHash("PoolOrder"   )), odbtools.POOLORDER_TYPEHASH,    "[ERROR] poolorder type hash");
		assert.equal(ethUtil.bufferToHex(typeHash("UserOrder"   )), odbtools.USERORDER_TYPEHASH,    "[ERROR] userorder type hash");

		assert.equal(await IexecODBLibOrdersInstance.EIP712DOMAIN_TYPEHASH(), odbtools.EIP712DOMAIN_TYPEHASH, "[ERROR] domain type hash (SC)"   );
		assert.equal(await IexecODBLibOrdersInstance.DAPPORDER_TYPEHASH(),    odbtools.DAPPORDER_TYPEHASH,    "[ERROR] dapporder type hash (SC)");
		assert.equal(await IexecODBLibOrdersInstance.DATAORDER_TYPEHASH(),    odbtools.DATAORDER_TYPEHASH,    "[ERROR] dataorder type hash (SC)");
		assert.equal(await IexecODBLibOrdersInstance.POOLORDER_TYPEHASH(),    odbtools.POOLORDER_TYPEHASH,    "[ERROR] poolorder type hash (SC)");
		assert.equal(await IexecODBLibOrdersInstance.USERORDER_TYPEHASH(),    odbtools.USERORDER_TYPEHASH,    "[ERROR] userorder type hash (SC)");
	});

	it("domain hash", async () => {
		console.log("[domain hash] ref:", ethUtil.bufferToHex(structHash("EIP712Domain", domain)));
		console.log("[domain hash] js: ", odbtools.DomainStructHash(domain)                      );
		console.log("[domain hash] sc: ", await TestInstance.EIP712DOMAIN_SEPARATOR()            );

		odbtools.setup(domain);
	});

	it("dapporder hash", async () => {
		console.log("[dapporder hash] ref:", ethUtil.bufferToHex(structHash("DappOrder", dapporder)));
		console.log("[dapporder hash] js: ", odbtools.DappOrderStructHash(dapporder));
		console.log("[dapporder hash] sc: ", await TestEthersInstance.getDappOrderHash(dapporder));
	});

	it("dataorder hash", async () => {
		console.log("[dataorder hash] ref:", ethUtil.bufferToHex(structHash("DataOrder", dataorder)));
		console.log("[dataorder hash] js: ", odbtools.DataOrderStructHash(dataorder));
		console.log("[dataorder hash] sc: ", await TestEthersInstance.getDataOrderHash(dataorder));
	});

	it("poolorder hash", async () => {
		console.log("[poolorder hash] ref:", ethUtil.bufferToHex(structHash("PoolOrder", poolorder)));
		console.log("[poolorder hash] js: ", odbtools.PoolOrderStructHash(poolorder));
		console.log("[poolorder hash] sc: ", await TestEthersInstance.getPoolOrderHash(poolorder));
	});

	it("userorder hash", async () => {
		console.log("[userorder hash] ref:", ethUtil.bufferToHex(structHash("UserOrder", userorder)));
		console.log("[userorder hash] js: ", odbtools.UserOrderStructHash(userorder));
		console.log("[userorder hash] sc: ", await TestEthersInstance.getUserOrderHash(userorder));
	});

	it("signature", async () => {

		odbtools.signDappOrder(dapporder, addressToPrivate(dappProvider ));
		odbtools.signDataOrder(dataorder, addressToPrivate(dataProvider ));
		odbtools.signPoolOrder(poolorder, addressToPrivate(poolScheduler));
		odbtools.signUserOrder(userorder, addressToPrivate(user         ));

		assert(await TestEthersInstance.checkDappOrder(dapporder), "[ERROR] invalid dapporder signature");
		assert(await TestEthersInstance.checkDataOrder(dataorder), "[ERROR] invalid dataorder signature");
		assert(await TestEthersInstance.checkPoolOrder(poolorder), "[ERROR] invalid poolorder signature");
		assert(await TestEthersInstance.checkUserOrder(userorder), "[ERROR] invalid userorder signature");

	});



});
