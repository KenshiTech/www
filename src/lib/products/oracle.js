import { Product } from "src/lib/product";
import { chainOptions } from "src/lib/dash/deep-index";
import { form } from "src/lib/form";
import { abiValidator } from "src/lib/dash/validators";
import { getOraclePrice } from "src/lib/dash/pricing";

const schema = {
  chain: {
    name: "Chain",
    oneOf: chainOptions.map((option) => option.value),
    methods: ["insert"],
  },
  address: {
    name: "Contract address",
    regex: /^0x[0-9a-f]{40}$/i,
    methods: ["insert", "update"],
  },
  signature: {
    name: "Contract address",
    regex: /.+/,
    methods: ["insert", "update"],
  },
  endpoint: {
    name: "Endpoint",
    regex: /https?:\/\/.+/,
    methods: ["insert", "update"],
  },
  calls: form.types.positiveNumber("Calls", ["insert", "credit"]),
  concurrency: form.types.positiveNumber("Concurrency", ["insert", "update"]),
  duration: form.types.positiveNumber("Duration", ["insert", "credit"]),
  fromBlock: form.types.positiveNumber("Block", ["insert"]),
  abi: {
    name: "ABI",
    validate(value) {
      if (!abiValidator(value)) {
        return "ABI is invalid";
      }
    },
    methods: ["insert", "update"],
  },
};

const endpoint = "https://api.kenshi.io/subscriptions/oracle";
const payloadKey = "oracle";
const name = "Custom oracle";

const prices = {
  insert(values) {
    return getOraclePrice(values.calls, values.duration);
  },
  credit(values) {
    return getOraclePrice(values.calls, values.duration);
  },
};

const valuesFromForm = {
  insert(values) {
    return { ...values, abi: JSON.parse(values.abi) };
  },
  update(values, current) {
    return { ...values, abi: JSON.parse(values.abi), id: current.id };
  },
  credit(values, current) {
    return { ...values, id: current.id };
  },
};

const query = (owner) => `{
    getUserSubs(owner: "${owner}", customOracles: true) {
      customOracles {
        id
        signature
        abi
        fromBlock
        blockchain
        address
        gasWallet
        expiresAt
        callsLeft
        endpoint
        concurrency
      }
    }
  }`;

const graphqlKey = "customOracles";

export const OracleProduct = new Product({
  schema,
  endpoint,
  payloadKey,
  name,
  prices,
  valuesFromForm,
  query,
  graphqlKey,
});