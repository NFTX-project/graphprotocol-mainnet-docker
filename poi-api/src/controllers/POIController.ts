import pool from '../dbconfig/dbconnector';
import * as crypto from "crypto";


class POIController {

    public async retrieve(subgraph = '', block=-1) {
	const client = await pool.connect();

	let result1;

	if ( subgraph != '' ) {
	    const sql = `select a.subgraph, a.name, b.latest_ethereum_block_number::INTEGER as latest_block from deployment_schemas a join subgraphs.subgraph_deployment b on a.subgraph=b.id where a.subgraph=$1`;
	    result1 = await client.query(sql, [subgraph]);
	} else {
	    const sql = "select a.subgraph, a.name, b.latest_ethereum_block_number::INTEGER as latest_block from deployment_schemas a join subgraphs.subgraph_deployment b on a.subgraph=b.id";
	    result1 = await client.query(sql);
	}
	
	const rows = result1.rows;
	
	for (var row of rows) {
	    
	    let result;
	    
	    if (block >= 0) {
		const sql = `select digest, lower(block_range::int4range) as block from ${row.name}."poi2$" where block_range::int4range @> $1::INTEGER`;
		result = await client.query(sql, [block]);
	    } else {
	    	const sql = `select digest, lower(block_range::int4range) as block from ${row.name}."poi2$" order by block_range desc limit 1`;
		result = await client.query(sql);
	    }
	    
	    const hash = crypto.createHash('sha256');
	    hash.update(result.rows[0].digest);
	    row['poi_hash'] = hash.digest('hex');		
	    row['poi_block'] = result.rows[0].block;
	    
	    delete row.name;
	}
	
        client.release();

	return rows;
    }
    
    list= async (req, res) => {
	try {
	    const subgraph = req.query.subgraph;
	    const block = req.query.block;

	    const result = await this.retrieve(subgraph, block ? Number(block) : -1);
	    
            res.send(result);
	    
        } catch (error) {
            res.status(400).send(error);
        }
    }

    compare= async (req, res) => {

	try {
	    let match = true;

	    const self = this;
	    const result = {match: [], differ: [], unavailable: []};


	    for (var deployment of req.body) 
	    {
		const state = await self.retrieve(deployment.subgraph, deployment.poi_block);
		const sameBlock = state[0].poi_block == deployment.poi_block;
		const sameHash = state[0].poi_hash == deployment.poi_hash;
		
                if (sameBlock) {
		    if (sameHash) {
			result.match.push(deployment.subgraph)
		    } else {
			result.differ.push(deployment.subgraph)
		    }
                } else {
		    result.unavailable.push(deployment.subgraph)
		}
	    }
	    
	    res.send(result);
	} catch (error) {
	    res.status(400).send(error);
	}
    }
}

export default POIController;
