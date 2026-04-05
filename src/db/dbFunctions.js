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


//building filter query based on query params
export const viewTransactions = async (client, role, userId, filters) => {
  let query = `SELECT * FROM transactions`;
  let conditions = []
  let values = []
  let index = 1;
  if(role=='viewer'){
    conditions.push(`user_id = $1`)
    values.push(userId)
    index++;
  }
   
  if (filters.type) {
    conditions.push(`type = $${index}`)
    values.push(filters.type);
    index++;
  }
  if (filters.category) {
    conditions.push(`category = $${index}`);
    values.push(filters.category);
    index++;
  }
  if (filters.is_active) {
    conditions.push(`is_active = $${index}`)
    values.push(filters.is_active === "true");
    index++;
  }
  if (filters.dateFrom) {
    conditions.push(`date >= $${index}`)
    values.push(filters.dateFrom);
    index++;
  }
  if (filters.dateTo) {
    conditions.push(`date <= $${index}`)
    values.push(filters.dateTo);
    index++;
  }
  if (filters.amountMin) {
    conditions.push(`amount >= $${index}`)
    values.push(filters.amountMin);
    index++;
  }
  if (filters.amountMax) {
    conditions.push(`amount <= $${index}`)
    values.push(filters.amountMax);
    index++;
  }

  if(conditions.length > 0){
    query+=' WHERE '
    console.log(conditions)
    let conditionsQuery = conditions.join(' AND ')
    query+=conditionsQuery;
  }

  const allowedSortFields = ["amount", "date", "category", "type"];
  if (filters.sortBy && allowedSortFields.includes(filters.sortBy)) {
    const order =
      filters.order && filters.order.toLowerCase() === "desc"
        ? "DESC"
        : "ASC";
    query+=` ORDER BY ${filters.sortBy} ${order} `
  }

  const size = parseInt(filters.size) || 25;
  //if limit not provided, send all results
  if(size){
    query+=` LIMIT $${index} `
    values.push(size)
    index++;
  }

  const page = parseInt(filters.page) || 1;
  query+= ` OFFSET $${index} `
  values.push((page - 1)*size);
  return await client.query(query, values);
};



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