import request from "request-promise";

const item = "item";

const handleHelp = (args: string[]) => {
  if (args.filter(x => x === "-h").length > 0) {
    console.log(`
usage: node ${args[1]} [parameters]

 Examples:
   -filter.flag=\\"SE\\" -filter.load\\>24         Lists servers in Sweden with a load greater than 24
   -output=ip_address -output=country           Outputs server ip address & country as json
   -output=ip_address -raw                      Outputs server ip address as raw text
   -h                                           Shows this help message  
`);
    process.exit(0);
  }
};

const getServers = () => {
  return request("https://api.nordvpn.com/server?limit=16384", { json: true });
};

const dynamicCallback = (body: string, param = item) =>
  // eslint-disable-next-line no-new-func
  new Function(param, `return ${body};`);

const createFilter = (args: string[]) => {
  const filterArgs = args.filter(x => x.startsWith("-filter."));

  const predicate =
    filterArgs.length === 0
      ? "true"
      : filterArgs
          .map(x => x.replace(/-filter/, item).replace(/=/, "==="))
          .join(" && ");

  return dynamicCallback(predicate);
};

const createMap = (args: string[]) => {
  const output = args
    .filter(x => x.startsWith("-output="))
    .map(x => x.substring(8));

  let projection: string = item;

  if (output.length > 0) {
    projection =
      output.length === 1
        ? `${item}.${output[0]}`
        : `{ ${output.map(x => `${x}: ${item}.${x}`).join(",")} };`;
  }

  return dynamicCallback(projection);
};

const printResult = (result: string[], args: string[]) => {
  if (args.filter(x => x === "-raw").length > 0) {
    const raw =
      result.length > 0 && typeof result[0] === "object"
        ? JSON.stringify(result)
        : result.join("\n");

    console.log(raw);
    return;
  }

  console.log(result);
};

const run = async (args: string[]) => {
  handleHelp(args);

  const servers = await getServers();

  const result = servers.filter(createFilter(args)).map(createMap(args));

  printResult(result, args);
};

export default { run };
