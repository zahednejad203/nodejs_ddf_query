import pkg from 'json-2-csv';
const { json2csv } = pkg;
import { readJSONfile, readCSV, hasProperty, writeFile} from './utils/toolbox.js'

let dataPointPackage = {}

function getResourses(joinList) {
    const resources = dataPointPackage.ddfSchema.datapoints
        .filter((datapoint) => joinList.includes(datapoint.value))
        .reduce((prev, curr) => {
            prev.push(...curr.resources);
            return prev;
        }, []);
    return dataPointPackage.resources.filter((dataResource) => resources.includes(dataResource.name));
}

function getKeys(resources, joinList) {
    const keys = [];
    keys.push(...joinList);
    resources.forEach((resource) => keys.push(...resource.schema.primaryKey));
    return keys.filter((value, index, self) => self.indexOf(value) === index);
}

function createObject(keys, line) {
    const object = {};
    keys.forEach((key) => object[key] = (line ?? {}).hasOwnProperty(key) ? line[key] : 'null');
    return object;
}

function updateObject(origin, update){
    Object.keys(update).forEach((key) => {
        if(update[key] === 'null') return
        origin[key] = update[key];
    })
}

function getFinalResult(resources, keys) {
    return new Promise((resolve, reject) => {
        const finalResult = [];
        // reading csv files
        resources.forEach(async (resource, index) => {
            await readCSV(resource.path, (line, nextLine) => {
                const newObject = createObject(keys, line);
                const existingRowIndex = finalResult.findIndex((row) => hasProperty(row, line, resource.schema.primaryKey));
                if (existingRowIndex > -1) {
                    updateObject(finalResult[existingRowIndex], newObject);
                } else {
                    finalResult.push(newObject);
                }
                nextLine();
            });
            if (index >= resources.length - 1) resolve(finalResult);
        });
    })
}

async function init() {
    if (!process.argv[2]) { 
        console.error('please provide a file path to the join list !!!!');
        return;
    }
    const list = process.argv[2];
    const joinList = await readJSONfile(list);
    dataPointPackage = await readJSONfile(process.env.DATA_POINT_PATH);
    
    const resources = getResourses(joinList);
    const keys = getKeys(resources, joinList);

    const finalResult = await getFinalResult(resources, keys);
    
    console.log(finalResult);
    json2csv(finalResult, (err, csv) => {
        if (err) {
            console.log(err);
            return
        }
        writeFile(process.argv[3] ?? process.env.DEFAULT_OUTPUT_PATH, csv);
    });
}

init();