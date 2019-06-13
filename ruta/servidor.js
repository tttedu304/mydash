const express = require('express');
const router = express.Router();
const CheckAuth = require('../auth/auth');
const moment = require('moment')
router.get('/:id', CheckAuth, async(req, res) => {
  let idserver = req.params.id;
  //Creamos la tabla para los servidores
  //estoy muteado por un momento....
  let base = req.db;

  
  let datoServer = req.bot.guilds.get(idserver);
  if(!datoServer) return res.redirect(`https://discordapp.com/oauth2/authorize?client_id=${process.env.CLIENT_ID}&scope=bot&permissions=-1&guild_id=${idserver}`)
  let baneados = await datoServer.fetchBans().then(bans => { return bans.size}); 
 
  function mayusRegion(region = datoServer.region){ //hace que la primera letra del nombre de la region se ponga en mayuscula, meramente estetico.
    return region.charAt(0).toUpperCase() + region.slice(1);
  };
  
 
  await base.run('CREATE TABLE IF NOT EXISTS server (idserver TEXT, status INTEGER)')
  await base.run('CREATE TABLE IF NOT EXISTS serverActivity (idserver TEXT, idchannel TEXT, datetime INTEGER, day INTEGER, month INTEGER)')
  const ServerDatos =
  new Promise((resolve, reject) => {
    base.get("SELECT * FROM server WHERE idserver = ?", idserver, async (err, d_server) => {
      if (err) {
        return reject(err);
      }
      if(!d_server){
        let sentencia = base.prepare("INSERT INTO server VALUES (?, ?)");
        
        sentencia.run(idserver, 0);
        
      } else {
        resolve(d_server);
      }
     
    });
  });

  const ServerActivity =
  new Promise((resolve, reject) => {
    base.all("SELECT * FROM serverActivity WHERE idserver = ? ", [idserver], function (err, rows) {
      if (err) {
        return reject(err);
      }
      if(rows){
       resolve(rows);
      
      }
         
    })
  });
  let activityDate= [];
  
  await ServerActivity.then(row => {
    row.map(d => {
      let tiempoMili = parseInt(d.datetime);
      let segundos = parseInt(tiempoMili = tiempoMili / 1000) % 60;
      let minutos = parseInt(tiempoMili = tiempoMili / 60) % 60;
      let horas = parseInt(tiempoMili = tiempoMili / 60) % 24;
      
      let mes = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      let mesName = mes[d.month];
      activityDate.push({
        idserver: d.idserver,
        idchannel: d.idchannel,
        mtime: tiempoMili,
        mes: mesName,
        dia: d.day,
        hora: horas,
        minuto: minutos,
        segundo: segundos
      })
    });
  });
  
  let activity = await ServerActivity.then(dt => {
    return dt;
  })
  
  //console.log(activityDate)
  /*
  WHERE DepartmentID >= 13  
  ORDER BY DepartmentID; 
  */
  let tiempo = new Date();
  let date = tiempo.getDate();
  let total = Math.abs(date - 4);
  let month = tiempo.getMonth();
  
  let lista = [];
  const CountActivity =
  new Promise((resolve, reject) => {
   base.all("SELECT * FROM serverActivity WHERE idserver = ? AND month = ? AND day >= ?", [idserver, month, total], function (err, rows) {
     
      if (err) {
        return reject(err);
      }
      if(rows){
       resolve(rows);
      
      }
         
    })
  })
  
 
  let dateDay = await CountActivity.then(data => {
  
    let dd = data.map(l => {
      let mes = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      let mesName = mes[l.month];
      return l.day+' '+mesName
    })
    let uniqs = dd.filter(function(item, index, array) {
      return array.indexOf(item) === index;
    })
   
    return uniqs;
  })
  let countDay = await CountActivity.then(data => {
    let lista =data.map(ld => {
      return ld.day;
    })
    
    const cantidad = lista.reduce((contNum, num) => {
      contNum[num] = (contNum[num] || 0) + 1;
      return contNum;
    }, {})
   
    return cantidad;
  })
  
  
  let activityCount = Object.values(countDay);
  activityCount.push(200)
  
  const CountActivityChannel =
  new Promise((resolve, reject) => {
   base.all("SELECT * FROM serverActivity WHERE idserver = ?", [idserver], function (err, rows) {
     
      if (err) {
        return reject(err);
      }
      if(rows){
       resolve(rows);
      
      }
         
    })
  })
  
  let channelsCount = await CountActivityChannel.then(lista => {
    let datos = lista.map(d => {
      return req.bot.guilds.get(idserver).channels.get(d.idchannel).name
    })
    const cantidad = datos.reduce((contNum, num) => {
      contNum[num] = (contNum[num] || 0) + 1;
      return contNum;
    }, {})
   
     return Object.values(cantidad);
    
    
  })
   let channelsDate = await CountActivityChannel.then(data => {
  
    let dd = data.map(l => {
      return req.bot.guilds.get(idserver).channels.get(l.idchannel).name
    })
    let uniqs = dd.filter(function(item, index, array) {
      return array.indexOf(item) === index;
    })
   
    return uniqs;
  })
 
  console.log(channelsCount)
  console.log(channelsDate)
  res.render("server.ejs", {
      guild: datoServer, 
      status: (req.isAuthenticated() ? `${req.user.username}#${req.user.discriminator}` : "login"),
      client: req.bot,
      bans: baneados,
      datoActivity: activity,
      datoChannels: channelsDate,
      countActivity: activityCount,
      countChannel: channelsCount,
      date: dateDay,
      user: req.user,
      login: (req.isAuthenticated() ? "si" : "no"),
      avatarURL:`https://cdn.discordapp.com/avatars/${req.user.id}/${req.user.avatar}.png`,
      iconURL:`https://cdn.discordapp.com/avatars/${req.user.id}/${req.user.avatar}.png?size=32`
  })  
})
.post('/:idServer', CheckAuth, async(req, res) => {
  let idserver = req.params.idServer;
  let msg_enviar = req.body.msg_send;
  let id_channel = req.body.channel_ID;
  
  if(!id_channel || id_channel === 'no_select') return res.redirect('../error404')
  if(!msg_enviar || msg_enviar.lenght === 0) return res.redirect('../error404')
  
  await req.bot.guilds.get(idserver).channels.get(id_channel).send(msg_enviar);
  await res.redirect(`/server/${idserver}`);
  
  
})

module.exports = router;