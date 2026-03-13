import swaggerAutogen from "swagger-autogen";
import * as fs from "node:fs/promises";

const doc = {
  info: {
    title: "AetioMed API",
    description: "API Documentation",
  },
  host: "localhost:3030",
  tags: [
    {
      name: "Cases",
      description: "Cases endpoints",
    },
  ],
};

const outputFile = "./swagger-output.json";
const routes = ["./router.ts"];

await swaggerAutogen({ openapi: "3.0.0" })(outputFile, routes, doc);

const outputFilePath = import.meta.dirname + outputFile.slice(1);
// parse the json file
await fs
  .readFile(outputFilePath, "utf8")
  .then((data) => JSON.parse(data))
  .then((docJson) => {
    return docJson;
  })
  // write the doc to the json file
  .then((docJson) =>
    fs.writeFile(outputFilePath, JSON.stringify(docJson, null, 2))
  );
