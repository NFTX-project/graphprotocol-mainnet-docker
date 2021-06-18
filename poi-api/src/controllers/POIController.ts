import pool from '../dbconfig/dbconnector';
import * as crypto from "crypto";


class POIController {

    public async list(req, res) {
        try {
	    console.log(typeof(req.query.subgraph));
	    console.log(typeof(req.query.block));
	    
	    const client = await pool.connect();

	    let result1;

	    if ( req.query.subgraph != undefined ) {
		const sql = `select a.subgraph, a.name, b.latest_ethereum_block_number::INTEGER as latest_block from deployment_schemas a join subgraphs.subgraph_deployment b on a.subgraph=b.id where a.subgraph=$1`;
		result1 = await client.query(sql, [req.query.subgraph]);
	    } else {
		const sql = "select a.subgraph, a.name, b.latest_ethereum_block_number::INTEGER as latest_block from deployment_schemas a join subgraphs.subgraph_deployment b on a.subgraph=b.id";
		result1 = await client.query(sql);
	    }

	    console.log("done", result1);
	    
	    const rows = result1.rows;

	    for (var row of rows) {

		let result;
		
		if (req.query.block) {
		    const sql = `select digest, lower(block_range::int4range) as block from ${row.name}."poi2$" where block_range::int4range @> $1::INTEGER`;
		    console.log(sql);
		    result = await client.query(sql, [req.query.block]);
		} else {
	    	    const sql = `select digest, lower(block_range::int4range) as block from ${row.name}."poi2$" order by block_range desc limit 1`;
		    console.log(sql);
		    result = await client.query(sql);
		}
		
		const hash = crypto.createHash('sha256');
		hash.update(result.rows[0].digest);
		row['poi_hash'] = hash.digest('hex');		
		row['poi_block'] = result.rows[0].block;
		
		delete row.name;
	    }

            client.release();
            res.send(rows);
	    
        } catch (error) {
            res.status(400).send(error);
        }
    }

    public async get(req, res) {

	try {
            const client = await pool.connect();

	    console.log(typeof(req.params.subgraph));
	    console.log(typeof(req.params.block));

            const sql = `select subgraph, name from deployment_schemas where subgraph=$1`;
	    console.log(sql);
	    
	    const { rows } = await client.query(sql, [req.params.subgraph]);

	    console.log(rows);

	    const row = rows[0];
            const poi_sql = `select digest from ${row.name}."poi2$" where block_range::int4range @> $1`;
	    console.log(poi_sql);
            const result = await client.query(poi_sql, [req.params.block]);

	    console.log(result);

            row['block'] = req.params.block;
	    // row['poi'] = result.rows[0].digest.toString('hex');

	    const hash = crypto.createHash('sha256');
            hash.update(result.rows[0].digest);
            row['poi_hash'] = hash.digest('hex');

	    delete row.name;
            client.release();

            res.send(row);
        } catch (error) {
            res.status(400).send(error);
        }
    }
}

export default POIController;
