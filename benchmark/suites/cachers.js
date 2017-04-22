"use strict";

//let _ = require("lodash");

let Promise	= require("bluebird");
let { getDataFile } = require("../utils");

let Benchmarkify = require("benchmarkify");
let benchmark = new Benchmarkify("Cachers benchmark").printHeader();

let Moleculer = require("../../");
let MemoryMapCacher = require("../../src/cachers/memory-map");

let key = "TESTKEY-12345";

let bench = benchmark.createSuite("Set & get 1k data with cacher");
let data = JSON.parse(getDataFile("1k.json"));

let broker = new Moleculer.ServiceBroker();

let memCacher = new Moleculer.Cachers.Memory();
memCacher.init(broker);

let memMapCacher = new MemoryMapCacher();
memMapCacher.init(broker);

let redisCacher = new Moleculer.Cachers.Redis({
	redis: {
		uri: "localhost:6379"
	},
	prefix: "BENCH-"
});
redisCacher.init(broker);

// ----
bench.add("Memory", done => {
	memCacher.set(key, data);
	memCacher.get(key).then(done);
});

bench.add("MemoryMap", () => {
	memMapCacher.set(key, data);
	return memMapCacher.get(key);	
});

bench.add("Redis", done => {
	redisCacher.set(key, data).then(() => redisCacher.get(key)).then(done);
});

bench.run().then(() => {
	redisCacher.close();
});

/*
=====================
  Cachers benchmark
=====================

Platform info:
==============
   Windows_NT 6.1.7601 x64
   Node.JS: 6.10.0
   V8: 5.1.281.93
   Intel(R) Core(TM) i7-4770K CPU @ 3.50GHz × 8

Suite: Set & get 1k data with cacher
√ Memory*           2,409,090 rps
√ MemoryMap         9,968,747 rps
√ Redis*               10,992 rps

   Memory*         -75.83%      (2,409,090 rps)   (avg: 415ns)
   MemoryMap            0%      (9,968,747 rps)   (avg: 100ns)
   Redis*          -99.89%         (10,992 rps)   (avg: 90μs)
-----------------------------------------------------------------------

*/