import express from 'express';
import axios from 'axios';

const app=express();
app.get('/users',async(req,res)=>{
    const response=await axios.get('http://jsonplaceholder.typicode.com/users');
    const users=response.data;
    let table=`<table border="1">
    <tr>
    <th>ID</th>
    <th>Name</th>
    <th>Email</th>
    </tr>`;
    users.forEach(user=>{
        table+=`<tr>
        <td>${user.id}</td>
        <td>${user.name}</td>
        <td>${user.email}</td>
        </tr>`;
    })
    table+=`</table>`;
    res.send(table);
})

app.listen(3000,()=>{
    console.log("server is runninggg")
})