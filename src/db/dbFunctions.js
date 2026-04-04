export const getUserDetailsByEmail = async (client, email)=>{
     const resp = await client.query(
               `SELECT * FROM users WHERE email = $1`,
               [email]
     );
     return resp;
}

export const createUser = async (client, name, email, hashedPassword, role) =>{
     const resp = await client.query({
               text : 'INSERT INTO users(name, email, password, role) VALUES ($1, $2, $3, $4)',
               values: [name,email,hashedPassword,role]
          })
     return resp;
}