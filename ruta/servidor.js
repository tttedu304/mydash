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
  await base.run('CREATE TABLE IF NOT EXISTS serverPrefix (idserver TEXT, prefix TEXT, status INTEGER)')
  await base.run('CREATE TABLE IF NOT EXISTS serverWord (idserver TEXT, words TEXT, status INTEGER)')
  await base.run('CREATE TABLE IF NOT EXISTS serverRolAuto (idserver TEXT, idrole TEXT, status INTEGER)')
  
  await base.run('CREATE TABLE IF NOT EXISTS serverWelcome (idserver TEXT, idchannel TEXT, msg TEXT, status INTEGER)')
  await base.run('CREATE TABLE IF NOT EXISTS serverLeave (idserver TEXT, idchannel TEXT, msg TEXT, status INTEGER)')
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
  
  const ServerWords =
  new Promise((resolve, reject) => {
    base.get("SELECT * FROM serverWord WHERE idserver = ?", idserver, async (err, filaWord) => {
      if (err) {
        return reject(err);
      }
      
      if(filaWord){
        resolve(filaWord)
      } else {
        resolve(false)
      }
     
    });
  });
  
  
  let datoWord = await ServerWords.then(datos => {
    if(datos) {
      return datos;
    } else {
      return false;
    }
  })
  
  
  const ServerRoles =
        new Promise((resolve, reject) => {
    base.get("SELECT * FROM serverRolAuto WHERE idserver = ?", idserver, async (err, filaRoles) => {
      if (err) {
        return reject(err);
      }
      
      if(filaRoles){
        resolve(filaRoles)
      } else {
        resolve(false)
      }
     
    });
  });
  
  
  let datoRol = await ServerRoles.then(dato => {
    if(dato) {
      return dato
    } else {
      return false;
    }
  })
  
  const serverWelcome = 
        new Promise((resolve, reject) => {
          base.get("SELECT * FROM serverWelcome WHERE idserver = ?", idserver , async (err, filas) => {
            if(err) {
              return reject(err);
            }
            
            if(filas){
              resolve(filas)
            } else {
              resolve(false)
            }
            
          })
        })
  
  let datoWelcome = await serverWelcome.then(dato => {
      if(dato){
        return dato;
      } else {
        return false;
      }
      
    
    
  })
  
  const serverLeave = 
        new Promise((resolve, reject) => {
          base.get("SELECT * FROM serverLeave WHERE idserver = ?", idserver , async (err, filas) => {
            if(err) {
              return reject(err);
            }
            
            if(filas){
              resolve(filas)
            } else {
              resolve(false)
            }
            
          })
        })
  
  let datoLeave = await serverLeave.then(dato => {
      if(dato){
        return dato;
      } else {
        return false;
      }
      
    
    
  })
  const serverPrefix = 
        new Promise((resolve, reject) => {
          base.get("SELECT * FROM serverPrefix WHERE idserver = ?", idserver, async (err, datos) => {
            if(err) {
              return reject(err);
            }
              
            let prefix;
              if(!datos){
                let sentencia = base.prepare("INSERT INTO serverPrefix VALUES (?, ?, ?)");
                sentencia.run(idserver, '!', 0);
                prefix = '!';
                
              } else {
               
                prefix = datos.prefix;
              }
              
            return resolve(prefix);
          })
        })
  
  let datoPrefix = await serverPrefix.then(datosPrefix => {
    
    return datosPrefix
  })
  
  
  
  
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
      datoWelcome_msg: datoWelcome ? datoWelcome.msg : "Escriba un mensaje de bienvenida.",
      datoWelcome_channel: datoWelcome ? datoWelcome.idchannel : "Seleccione un canal.",
      datoLeave_msg: datoLeave ? datoLeave.msg : "Escriba un mensaje de salida.",
      datoLeave_channel: datoLeave ? datoLeave.idchannel : "Seleccione un canal.",
      datoRoleAuto: datoRol ? datoRol.idrole : "Seleccione un rol.",
      datosWords: datoWord ? datoWord.words : "Sin palabras.",
      datoChannels: channelsDate,
      countActivity: activityCount,
      countChannel: channelsCount,
      prefix: datoPrefix,
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
.post('/:id/prefix', CheckAuth, async(req, res) => {
      
    let base = req.db;
    let idserver = req.params.id;
    let newPrefix = req.body.newPrefix;
    
    base.get("SELECT * FROM serverPrefix WHERE idserver = ?", idserver, function (err, filas) {
      if(!filas) return;
      base.run(`UPDATE serverPrefix SET prefix = '${newPrefix}' WHERE idserver = ${idserver}`);
      res.redirect(`/server/${idserver}`);
      
    });
    
})
.post('/:id/wordsban', CheckAuth, async(req, res) => {
      
    let base = req.db;
    let idserver = req.params.id;
    let words = req.body.words;
    
    base.get("SELECT * FROM serverWord WHERE idserver = ?", idserver, function (err, filas) {
     if(!filas) {
        
        let sentencia = base.prepare("INSERT INTO serverWord VALUES (?, ?, ?)");
        sentencia.run(idserver, words, 0);
        res.redirect(`/server/${idserver}`);
         console.log('NEW PALABRAS: '+words)
      } else {
         if(words === '') words = filas.words;
         base.run(`UPDATE serverWord SET words = '${words}' WHERE idserver = '${idserver}'`);
         res.redirect(`/server/${idserver}`); 
         console.log('NEW PALABRAS: '+filas.words)
      }
      
    });
    
    
    
})
.post('/:id/welcome', CheckAuth, async(req, res) => {
      
    let base = req.db;
    let idserver = req.params.id;
    let msg_welcome = req.body.msg_Welcome;
    let id_channel = req.body.channel_ID;
    
    console.log('ID CHANNEL: '+ id_channel)
    base.get("SELECT * FROM serverWelcome WHERE idserver = ?", idserver, function (err, filas) {
      if(!filas) {
        
        let sentencia = base.prepare("INSERT INTO serverWelcome VALUES (?, ?, ?, ?)");
        sentencia.run(idserver, id_channel, msg_welcome, 0);
        res.redirect(`/server/${idserver}`);
      } else {
       if(msg_welcome === '') msg_welcome = filas.msg;
       if(!id_channel) id_channel = filas.idchannel
       base.run(`UPDATE serverWelcome SET idchannel = '${id_channel}', msg = '${msg_welcome}' WHERE idserver = '${idserver}'`);
       res.redirect(`/server/${idserver}`); 
      }

      
    });
    
})
.post('/:id/leave', CheckAuth, async(req, res) => {
      
    let base = req.db;
    let idserver = req.params.id;
    let msg_leave = req.body.msg_Leave;
    let id_channel = req.body.channel_ID;
    
    console.log('ID CHANNEL: '+ id_channel)
    base.get("SELECT * FROM serverLeave WHERE idserver = ?", idserver, function (err, filas) {
      if(!filas) {
        
        let sentencia = base.prepare("INSERT INTO serverLeave VALUES (?, ?, ?, ?)");
        sentencia.run(idserver, id_channel, msg_leave, 0);
        res.redirect(`/server/${idserver}`);
      } else {
       if(msg_leave === '') msg_leave = filas.msg;
       if(!id_channel) id_channel = filas.idchannel
       base.run(`UPDATE serverLeave SET idchannel = '${id_channel}', msg = '${msg_leave}' WHERE idserver = '${idserver}'`);
       res.redirect(`/server/${idserver}`); 
      }

      
    });
    
})
.post('/:id/rolauto', CheckAuth, async(req, res) => {
      
    let base = req.db;
    let idserver = req.params.id;
    let id_role = req.body.rol_ID;
    
    
    base.get("SELECT * FROM serverRolAuto WHERE idserver = ?", idserver, function (err, filas) {
      if(!filas) {
        
        let sentencia = base.prepare("INSERT INTO serverRolAuto VALUES (?, ?, ?)");
        sentencia.run(idserver, id_role, 0);
        
        res.redirect(`/server/${idserver}`);
      } else {
      
       if(!id_role) id_role = filas.idrole
       base.run(`UPDATE serverRolAuto SET idrole = '${id_role}' WHERE idserver = '${idserver}'`);
       res.redirect(`/server/${idserver}`); 
      }

      
    });
    
})
module.exports = router;