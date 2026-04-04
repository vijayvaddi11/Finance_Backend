export const fetchUserDetailsByEmail = async (client, email)=>{
     const resp = await client.query(
               `SELECT * FROM users WHERE email = $1`,
               [email]
     );
     return resp;
}

export const createUser = async (client, name, email, hashedPassword, role) =>{
     const resp = await client.query({
               text : 'INSERT INTO users(name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
               values: [name,email,hashedPassword,role]
          })
     return resp;
}

export const createTransaction = async(client, userId, amount, type, category, date, note)=>{
     return await client.query(
          `INSERT INTO transactions (user_id, amount, type, category, date, note)
          VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
          [userId, amount, type, category, date, note]
     )
}

export const fetchTransactionsById = async(client, transactionId) =>{
     const resp = await client.query(
               `SELECT * FROM transactions WHERE id = $1`,
               [transactionId]
     );
     if(resp && resp.rows) {
          return resp.rows[0]
     }else {
          return
     }
}

export const updateTransactionByID = async(client, id, transaction) =>{
     return await client.query(
      `UPDATE transactions 
       SET amount=$1, type=$2, category=$3, date=$4, note=$5
       WHERE id=$6 RETURNING *`,
      [transaction['amount'], transaction['type'], transaction['category'], transaction['date'], transaction['note'], id]
    );
}

export const softDeleteTransactionByID = async(client, id) =>{
     return await client.query(
      `UPDATE transactions 
       SET is_active=false
       WHERE id=$1`,
      [id]
    );
}

export const deleteTransactionByID = async(client, id) =>{
     return await client.query(
      `DELETE from transactions
       WHERE id=$1`,
      [id]
    );
}

export const viewTransactions = async(client,userid)=>{
     return await client.query(
          `SELECT * from transactions
          WHERE user_id = $1`,
          [userid]
     );
}