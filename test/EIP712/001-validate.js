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

const ethers    = require("ethers"); // for ABIEncoderV2
const constants = require("../constants");
const odbtools  = require("../../utils/odb-tools");


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

	var jsonRpcProvider          = null;
	var IexecClerkEthersInstance = null;

	verifyDappOrder = async dapporder => IexecClerkEthersInstance.verify(await (await Dapp.at(dapporder.dapp)).m_owner(), odbtools.DappOrderStructHash(dapporder), dapporder.sign);
	verifyDataOrder = async dataorder => IexecClerkEthersInstance.verify(await (await Data.at(dataorder.data)).m_owner(), odbtools.DataOrderStructHash(dataorder), dataorder.sign);
	verifyPoolOrder = async poolorder => IexecClerkEthersInstance.verify(await (await Pool.at(poolorder.pool)).m_owner(), odbtools.PoolOrderStructHash(poolorder), poolorder.sign);
	verifyUserOrder = async userorder => IexecClerkEthersInstance.verify(userorder.requester,                             odbtools.UserOrderStructHash(userorder), userorder.sign);

	before("configure", async () => {
		console.log("# web3 version:", web3.version);

		jsonRpcProvider          = new ethers.providers.JsonRpcProvider();
		IexecClerkEthersInstance = new ethers.Contract("0xBfBfD8ABc99fA00Ead2C46879A7D06011CbA73c5", IexecClerk.abi, jsonRpcProvider);

		odbtools.setup({
			name:              "iExecODB",
			version:           "3.0-alpha",
			chainId:           26,
			verifyingContract: IexecClerkEthersInstance.address,
		});
	});

	dapporder = {"dapp":"0x385fFe1c9Ec3d6a0798eD7a13445Cb2B2de9fd09","dappprice":1,"volume":1,"datarestrict":"0x0000000000000000000000000000000000000000","poolrestrict":"0x0000000000000000000000000000000000000000","userrestrict":"0x0000000000000000000000000000000000000000","salt":"0x47ea654075450cb8cbc92f06ae0a3d60","sign":{"r":"0x8bdd04ac5839db9259e4abfd6374c49bdfc350522ab712f8dd1ec495318f27e0","s":"0x4983e069f5979c088fa6043847452b3597aa2a362728b57bf764f3bea2335104","v":27}}
	dataorder = {"data":"0x82D7300c32daFcF6bfdFcf53a2aeDfEF1D6C3415","dataprice":1,"volume":1,"dapprestrict":"0x0000000000000000000000000000000000000000","poolrestrict":"0x0000000000000000000000000000000000000000","userrestrict":"0x0000000000000000000000000000000000000000","salt":"0x71aa9df495c2df08a774ab8994b39bad","sign":{"r":"0x62a873c756d0c9bc06fb965fc914497bbfdaffec6563c3987fdfbd395630b02e","s":"0x0f715eeb631a300b85c2b160c180aec4f777751e10f0fb75a40113e5b82b2f26","v":27}}
	poolorder = {"pool":"0xd69663e2263C7D8002500361C742de967Ca488e2","poolprice":1,"volume":1,"category":4,"trust":100,"tag":0,"dapprestrict":"0x0000000000000000000000000000000000000000","datarestrict":"0x0000000000000000000000000000000000000000","userrestrict":"0x0000000000000000000000000000000000000000","salt":"0xd1a08cec8d166f4fd5fe0b54ded1e3a3","sign":{"r":"0xaa3cb5c998b3840e6afab66a0d10f87c3755b23d5106501a8c05ab9cc7ffde88","s":"0x4afb619d1dc48edce6b035c250c9214c033ec7195cc0848db4112dc046692a36","v":27}}
	userorder = {"dapp":"0x385fFe1c9Ec3d6a0798eD7a13445Cb2B2de9fd09","dappmaxprice":1,"data":"0x82D7300c32daFcF6bfdFcf53a2aeDfEF1D6C3415","datamaxprice":1,"pool":"0x0000000000000000000000000000000000000000","poolmaxprice":1,"volume":1,"category":4,"trust":100,"tag":0,"requester":"0x0ad5797Bc72F14430e4887c2bc6F9b478107b9d3","beneficiary":"0x0ad5797Bc72F14430e4887c2bc6F9b478107b9d3","callback":"0x0000000000000000000000000000000000000000","params":"toto","salt":"0x4bd16fe8f78e2a5eee9facb56a812373","sign":{"r":"0xc2e056c29397ca600768625b290d94fe9d11b3f4da326218d2056fee9c199bd3","s":"0x3c110b187278def606162778754ac861ab2d38d39cd285e561926fcbd56ed3c9","v":28}}

	it("verifyDappOrder", async () => assert(await verifyDappOrder(dapporder)));
	it("verifyDataOrder", async () => assert(await verifyDataOrder(dataorder)));
	it("verifyPoolOrder", async () => assert(await verifyPoolOrder(poolorder)));
	it("verifyUserOrder", async () => assert(await verifyUserOrder(userorder)));


	it("match", async () => {

		assert.equal(await(await Dapp.at(dapporder.dapp)).m_owner(), dappProvider );
		assert.equal(await(await Data.at(dataorder.data)).m_owner(), dataProvider );
		assert.equal(await(await Pool.at(poolorder.pool)).m_owner(), poolScheduler);
		IexecClerkEthersInstance.viewAccountLegacy(dappProvider ).then(balance => console.log("dappProvider  balance:", balance.stake.toNumber(), balance.locked.toNumber()));
		IexecClerkEthersInstance.viewAccountLegacy(dataProvider ).then(balance => console.log("dataProvider  balance:", balance.stake.toNumber(), balance.locked.toNumber()));
		IexecClerkEthersInstance.viewAccountLegacy(poolScheduler).then(balance => console.log("poolScheduler balance:", balance.stake.toNumber(), balance.locked.toNumber()));

		dapphash = odbtools.DappOrderStructHash(dapporder);
		datahash = odbtools.DataOrderStructHash(dataorder);
		poolhash = odbtools.PoolOrderStructHash(poolorder);
		userhash = odbtools.UserOrderStructHash(userorder);

		console.log("dapp consumed:", (await IexecClerkEthersInstance.m_consumed(dapphash)).toNumber());
		console.log("data consumed:", (await IexecClerkEthersInstance.m_consumed(datahash)).toNumber());
		console.log("pool consumed:", (await IexecClerkEthersInstance.m_consumed(poolhash)).toNumber());
		console.log("user consumed:", (await IexecClerkEthersInstance.m_consumed(userhash)).toNumber());

/*
		await IexecClerkEthersInstance.connect(jsonRpcProvider.getSigner(dappProvider )).cancelDappOrder(dapporder, { gasLimit: constants.AMOUNT_GAS_PROVIDED });
		await IexecClerkEthersInstance.connect(jsonRpcProvider.getSigner(dataProvider )).cancelDataOrder(dataorder, { gasLimit: constants.AMOUNT_GAS_PROVIDED });
		await IexecClerkEthersInstance.connect(jsonRpcProvider.getSigner(poolScheduler)).cancelPoolOrder(poolorder, { gasLimit: constants.AMOUNT_GAS_PROVIDED });
		await IexecClerkEthersInstance.connect(jsonRpcProvider.getSigner(user         )).cancelUserOrder(userorder, { gasLimit: constants.AMOUNT_GAS_PROVIDED });
*/

/*
		txNotMined = await IexecClerkEthersInstance
		.connect(jsonRpcProvider.getSigner(user))
		.matchOrders(
			dapporder,
			dataorder,
			poolorder,
			userorder,
			{ gasLimit: constants.AMOUNT_GAS_PROVIDED }
		);
		console.log("txNotMined:", txNotMined);
*/

		console.log("dapp consumed:", (await IexecClerkEthersInstance.m_consumed(dapphash)).toNumber());
		console.log("data consumed:", (await IexecClerkEthersInstance.m_consumed(datahash)).toNumber());
		console.log("pool consumed:", (await IexecClerkEthersInstance.m_consumed(poolhash)).toNumber());
		console.log("user consumed:", (await IexecClerkEthersInstance.m_consumed(userhash)).toNumber());


	});

});
