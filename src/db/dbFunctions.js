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
          WHERE user_id = $1 and is_active = true`,
          [userid]
     );
}



//dasboard
export const fetchRecordsByDateForUser = async (client, userId, fromDate) => {
  return await client.query(
    `SELECT * FROM transactions 
     WHERE user_id = $1 AND date >= $2 AND is_active = true`,
    [userId, fromDate]
  );
};

export const fetchRecordsByDate = async (client, fromDate) => {
  return await client.query(
    `SELECT * FROM transactions 
     WHERE date >= $1 AND is_active = true`,
    [fromDate]
  );
};


export const fetchByCategoryForUser = async (client, userId, category) => {
  return await client.query(
    `SELECT * FROM transactions 
     WHERE user_id = $1 AND category ILIKE $2 AND is_active = true`,
    [userId, `%${category}%`]
  );
};

export const fetchByCategory = async (client, category) => {
  return await client.query(
    `SELECT * FROM transactions 
     WHERE category ILIKE $1 AND is_active = true`,
    [`%${category}%`]
  );
};

export const fetchRecentForUser = async (client, userId) => {
  return await client.query(
    `SELECT * FROM transactions 
     WHERE user_id = $1 AND is_active = true
     ORDER BY date DESC LIMIT 15`,
    [userId]
  );
};

export const fetchRecent = async (client) => {
  return await client.query(
    `SELECT * FROM transactions 
     WHERE is_active = true
     ORDER BY date DESC LIMIT 15`
  );
};

export const fetchAllForUser = async (client, userId) => {
  return await client.query(
    `SELECT * FROM transactions WHERE user_id = $1 AND is_active = true`,
    [userId]
  );
};

export const fetchAll = async (client) => {
  return await client.query(
    `SELECT * FROM transactions WHERE is_active = true`
  );
};