const { invoke } = window.__TAURI__.core;
let re = null;
let sprites_change = null;
var move_poke = null;
async function get_pokemon(pokemon) {
  try {
    document.querySelector("#level").innerHTML = "";
    document.querySelector("#egg").innerHTML = "";
    document.querySelector("#machine").innerHTML = "";
    document.querySelector("#tutor").innerHTML = "";
    document.querySelector("#special").innerHTML = "";
    document.querySelector("#gens").value = "";
    
    const pokeDetails = await invoke('get_pokemon_types', { pokemonName: pokemon })
    console.log(`${pokemon}'s types:`, pokeDetails.types);

    document.querySelector("#name").textContent = pokemon

    document.querySelector("#type1").innerHTML = pokeDetails.types[0];
    if (pokeDetails.types[1] != null) {
      document.querySelector("#type2").innerHTML = pokeDetails.types[1];
    } else {
      document.querySelector("#type2").innerHTML = "";
    }
    document.querySelector("#dex_num").textContent = "national dex: " + pokeDetails.id;
    let abs = document.querySelector("#ablities");
    abs.innerHTML = ""
    for (let i = 0; i < pokeDetails.abilities.length; i++) {

      let abs_string = pokeDetails.abilities[i].split(" ")
      if (abs_string[1] == "true") {
        abs.innerHTML += "hidden ability" + ": " + abs_string[0] + "<br>"
      } else {
        abs.innerHTML += "ability " + i + ": " + abs_string[0] + "<br>"
      }

    }

    let e = document.querySelector("#sprite")
    let child = e.lastElementChild;
    while (child) {
      e.removeChild(child);
      child = e.lastElementChild;
    }
    addSprite(pokeDetails.sprites[0])
    addSprite(pokeDetails.sprites[2])
    sprites_change = pokeDetails.sprites;
    document.querySelector("#toggle_shiny").classList.add("visible");
    document.querySelector("#toggle_shiny").classList.remove("hidden");
    document.querySelector("#form_label").classList.add("visible");
    document.querySelector("#form_label").classList.remove("hidden");
    let stat = document.querySelector("#stats_table");

    let stat_old = stat.lastElementChild;
    while (stat_old) {
      stat.removeChild(stat_old);
      stat_old = stat.lastElementChild;
    }
    for (let i = 0; i < pokeDetails.stats.length; i++) {
      let s = document.createElement("tr");
      s.className = "stats_block"
      let stat_info = pokeDetails.stats[i].split(" ")
      if (stat_info[0] === "special-attack") {
        stat_info[0] = "spATK";
      } else if (stat_info[0] === "special-defense") {
        stat_info[0] = "spDEF";
      }
      let line_color = ""
      if (Number(stat_info[1]) >= 100) {
        line_color = "green";
      } else if (Number(stat_info[1]) >= 60 && Number(stat_info[1]) < 100) {
        line_color = "yellow";
      } else {
        line_color = "red";
      }
      s.innerHTML =
        "<td>" + stat_info[0] + ":&nbsp " + stat_info[1] + "</td>" +
        "<td>" +
        "<hr class='stat_lines' style='width:" + (300 * (Number(stat_info[1]) / 225)) + "px; background-color:" + line_color + ";'>" +
        "</td>";


      stat.appendChild(s)
    }
    if(!(pokemon.includes("mega")  || pokemon.includes("gmax"))){
      const pokeForms = await invoke('get_pokemon_forms', { pokemonName: pokemon })
      let f = document.querySelector("#forms")
      let form_old = f.lastElementChild;
      while (form_old) {
        f.removeChild(form_old);
        form_old = f.lastElementChild;
      }
      for (let i = 0; i < pokeForms.varieties.length; i++) {
        let form = document.createElement("button");
        form.innerHTML = pokeForms.varieties[i]
        form.classList.add("form_button")
        form.value = pokeForms.varieties[i]
        f.appendChild(form)
      }
      let forms_btn = document.querySelectorAll(".form_button")
      forms_btn.forEach(fb => {
        fb.addEventListener("click", function () {
  
          if (document.querySelector("#name").textContent != this.value) {
  
            console.log(this.value)
            get_pokemon(this.value)
          }
  
        })
  
      });
  
  
      let evo_url = pokeForms.evos;
  
      const evo_data = await invoke('fetch_raw_json', { chainUrl: evo_url })
  
      const evolutionTree = await invoke('parse_evolution_detail', { rawJson: evo_data });
      const evos = document.querySelector("#evo");
      renderEvolutionPathsWithDetails(evolutionTree, evos);
    }else{
      document.querySelector("#evo").innerText = "Special Evolution does not have evolution chain, see original form for detail"
    }
    document.querySelector("#moveSet").classList.remove("hidden")
    document.querySelector("#moveSet").classList.add("visible")
    get_moves(pokemon);
  } catch (error) {
    console.error('Error fetching Pokémon types:', error);
  }
}

window.addEventListener("DOMContentLoaded", () => {
  document.querySelector("#toggle_shiny").classList.add("hidden")
  document.querySelector("#toggle_shiny").classList.remove("visible")
  document.querySelector("#form_label").classList.add("hidden")
  document.querySelector("#form_label").classList.remove("visible")
  document.querySelector("#moveSet").classList.add("hidden")
  document.querySelector("#moveSet").classList.remove("visible")
  document.querySelector("#poke-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var poke = document.querySelector("#poke-input").value;

    get_pokemon(poke);
    console.log(poke);
    document.querySelector("#poke-input").value = ""
    add_history(poke)

  })

  document.querySelector("#poke-input").addEventListener("input", async function () {
    let count = 0;
    let input_area = document.querySelector("#searcher");
    let val = document.querySelector("#poke-input").value.trim();


    let existingAutocomplete = document.querySelector("#auto");
    if (existingAutocomplete) {
      existingAutocomplete.remove();
    }

    if (val !== "") {
      if (re === null) {
        await fetch_pokes();
      }

      if (re === null) {
        console.error("Failed to fetch Pokémon list.");
        return;
      }


      let autocomp = document.createElement("div");
      autocomp.id = "auto";
      input_area.appendChild(autocomp);


      for (let i = 0; i < re.length; i++) {
        if (re[i].substr(0, val.length).toUpperCase() === val.toUpperCase()) {
          let b = document.createElement("div");
          b.setAttribute("class", "autoEntry");
          b.setAttribute("id", i + "_entry");
          b.innerHTML = `<strong>${re[i].substr(0, val.length)}</strong>${re[i].substr(val.length)}`;
          b.innerHTML += `<input type="hidden" value="${re[i]}">`;


          b.addEventListener("click", function () {
            document.querySelector("#poke-input").value = this.getElementsByTagName("input")[0].value;


            autocomp.remove();
          });

          autocomp.appendChild(b);
          count++;
        }
      }

      console.log("Autocomplete suggestions count:", count);
    }
  });
  document.querySelector("#shiny").addEventListener("change", async function () {
    console.log("changed")
    let e = document.querySelector("#sprite")
    let child = e.lastElementChild;
    while (child) {
      e.removeChild(child);
      child = e.lastElementChild;
    }
    let shiny_msg = document.getElementById("error_shiny")
    if (document.querySelector("#shiny").value == "normal") {


      addSprite(sprites_change[0])
      addSprite(sprites_change[2])
      shiny_msg.style.display = "none";
    } else if (document.querySelector("#shiny").value == "shiny") {
      if(sprites_change[1] && sprites_change[3]){
        addSprite(sprites_change[1])
        addSprite(sprites_change[3])
        shiny_msg.style.display = "none";
      }else{
        addSprite(sprites_change[0])
        addSprite(sprites_change[2])
        shiny_msg.style.display = "block";
      }
     
    }
  })

  document.querySelector("#Hist").addEventListener("change", (event) => {
    const selectedValue = event.target.value; 
    const pokeInput = document.querySelector("#poke-input");

    if (pokeInput) {
      pokeInput.value = selectedValue; 
    }
  });

  document.querySelector("#gens").addEventListener("change", (event) => {
    if (move_poke != null) {
      render_moves(event.target.value);
    }
  })
});


async function fetch_pokes() {
  try {
    re = await invoke("read_pokemons");
  

  } catch (error) {
    console.error("Error fetching Pokémon list:", error);
    re = null;
  }
}

function addSprite(hrc) {
  let e = document.querySelector("#sprite")

  let im = document.createElement("img")
  im.src = hrc
  im.classList.add("sprites")
  e.appendChild(im)

}

async function renderEvolutionPathsWithDetails(evolutionTree, container) {
  container.innerHTML = "";

  const paths = extractEvolutionPathsWithDetails(evolutionTree);

  for (const { path, details } of paths) {
    console.log(path)
    console.log(details)
    const row = document.createElement("div");
    row.classList.add("evolution-row");

    for (let i = 0; i < path.length; i++) {

      const evoImg = document.createElement("img");
      const evoSprite = await invoke("get_evo_sprite", { pokemonName: path[i] });
      evoImg.src = evoSprite.sprite;
      evoImg.classList.add("evo_sprite");
      row.appendChild(evoImg);


      if (i < path.length - 1) {
        const evoArrow = document.createElement("div");
        evoArrow.classList.add("evo_arrow");


        const evolutionDetails = details[i + 1] || {};
        console.log(evolutionDetails)
        if (Array.isArray(evolutionDetails)) {
          evolutionDetails.forEach(detail => {
            Object.entries(detail).forEach(([key, value]) => {
              if (value && value !== false && value !== "") {
                const detailText = document.createElement("p");

                if (value.name) {
                  detailText.innerText = `${key}: ${value.name}`;
                } else {
                  detailText.innerText = `${key}: ${value}`;
                }

                evoArrow.appendChild(detailText);
              }
            });
          });
        }



        const arrowImg = document.createElement("img");
        arrowImg.src = "assets/arrow.svg";
        arrowImg.classList.add("arrow_img");
        evoArrow.appendChild(arrowImg);

        row.appendChild(evoArrow);
      }
    }


    container.appendChild(row);
  }
 
}




function extractEvolutionPathsWithDetails(node, currentPath = [], currentDetails = [], allPaths = []) {
  const newPath = [...currentPath, node.species_name];
  const newDetails = [...currentDetails, node.evolution_details];

  if (node.evolves_to.length === 0) {
    allPaths.push({ path: newPath, details: newDetails });
  } else {

    node.evolves_to.forEach(child =>
      extractEvolutionPathsWithDetails(child, newPath, newDetails, allPaths)
    );
  }

  return allPaths;
}


function add_history(pokemon_Name) {
  let h = document.querySelector("#Hist");
  if (h.childElementCount >= 10) {
    let e = h.lastElementChild
    h.removeChild(e)
  }
  let history = document.createElement("option")
  history.classList.add("history_option")
  history.value = pokemon_Name
  history.innerText = pokemon_Name

  h.insertBefore(history, h.firstChild);

}

async function get_moves(pokemon) {
  try {
    const moves = await invoke('parse_moves', { pokemonName: pokemon })
    console.log(moves)
    move_poke = moves
    const vers = await invoke('get_versions');
    console.log(vers)
    for (let i = 0; i < vers.versions.length; i++) {
      if (vers.versions[i] != "the-isle-of-armor" || vers.versions[i] != "the-crown-tundra" || vers.versions[i] != "the-teal-mask" || vers.versions[i] != "the-indigo-disk") {
        let v = document.createElement("option")
        v.classList.add("version_select")
        v.value = vers.versions[i]
        v.innerText = vers.versions[i]
        document.querySelector("#gens").appendChild(v)
      }

    }
  } catch (error) {
    console.error('Error fetching Pokémon types:', error);
  }
}



async function render_moves(generation) {

  let a = document.querySelector("#learnset")

  let found_arr = []

  for (var i in move_poke) {
    console.log(move_poke[i])

    for (var j in move_poke[i]) {

      for (var k in move_poke[i][j]) {
        console.log(move_poke[i][j][k])
        if (move_poke[i][j][k][2] == generation) {

          found_arr.push([j, move_poke[i][j][k][0], move_poke[i][j][k][1]])


          break;
        }
      }

    }
  }

  if (found_arr != []) {
    let level_up = []
    let egg = []
    let machine = []
    let tutor = []
    let special = []

    for (let i = 0; i < found_arr.length; i++) {
      switch (found_arr[i][2]) {
        case "machine":
          machine.push(found_arr[i][0])
          break
        case "tutor":
          tutor.push(found_arr[i][0])
          break
        case "egg":
          egg.push(found_arr[i][0])
          break
        case "level-up":
          level_up.push([found_arr[i][0], found_arr[i][1]])
          break
        default:
          special.push(found_arr[i][0])
      }
    }
    level_up.sort((a, b) => {
      return parseInt(a[1], 10) - parseInt(b[1], 10);
    });


    if (level_up != []) {
      let level = document.querySelector("#level")
      level.innerHTML = ""
      let title = document.createElement("tr")
      title.innerHTML = "<td colspan='10'>Level Up</td>"
      let header = document.createElement("tr")
      header.innerHTML = "<th>Name</th><th>level_req</th><th>Type</th><th>Dmg_Class</th><th>Power</th><th>Accuracy</th><th>PP</th><th>Effect</th><th>Target</th><th>Priority</th>"
      level.appendChild(title)
      level.appendChild(header)
      for (let i = 0; i < level_up.length; i++) {
        let move_det = await get_move_details(level_up[i][0])
        let b = document.createElement("tr")
        b.classList.add("moves")
        let data = 
        `
        <td>${level_up[i][0]}</td>
        <td>${level_up[i][1]}</td>
        <td>${move_det.type}</td>
        <td>${move_det.damage_class}</td>
        <td>${move_det.power}</td>
        <td>${move_det.accuracy}</td>
        <td>${move_det.pp}</td>
        <td>${move_det.effect_entry}</td>
        <td>${move_det.target}</td>
        <td>${move_det.priority}</td>
        `
        b.innerHTML = data
          
        level.appendChild(b)
      }
    }

    if (tutor != []) {
      
      let tuto = document.querySelector("#tutor")
      tuto.innerHTML = ""
      let title = document.createElement("tr")
      title.innerHTML = "<td colspan='10'>Tutor</td>"
      let header = document.createElement("tr")
      header.innerHTML = "<th>Name</th><th>level_req</th><th>Type</th><th>Dmg_Class</th><th>Power</th><th>Accuracy</th><th>PP</th><th>Effect</th><th>Target</th><th>Priority</th>"
      tuto.appendChild(title)
      tuto.appendChild(header)
      for (let i = 0; i < tutor.length; i++) {
        let move_det = await get_move_details(tutor[i])
        let b = document.createElement("tr")
        b.classList.add("moves")
        let data = 
        `
        <td>${tutor[i]}</td>
        <td>0</td>
        <td>${move_det.type}</td>
        <td>${move_det.damage_class}</td>
        <td>${move_det.power}</td>
        <td>${move_det.accuracy}</td>
        <td>${move_det.pp}</td>
        <td>${move_det.effect_entry}</td>
        <td>${move_det.target}</td>
        <td>${move_det.priority}</td>
        `
        b.innerHTML = data

        tuto.appendChild(b)
      }
    }

    if (machine != []) {
      let mac = document.querySelector("#machine")
      mac.innerHTML = ""
      let title = document.createElement("tr")
      title.innerHTML = "<td colspan='10'>Tm/Tr</td>"
      let header = document.createElement("tr")
      header.innerHTML = "<th>Name</th><th>level_req</th><th>Type</th><th>Dmg_Class</th><th>Power</th><th>Accuracy</th><th>PP</th><th>Effect</th><th>Target</th><th>Priority</th>"
      mac.appendChild(title)
      mac.appendChild(header)
      for (let i = 0; i < machine.length; i++) {
        let move_det = await get_move_details(machine[i])
        let b = document.createElement("tr")
        b.classList.add("moves")
        let data = 
        `
        <td>${machine[i]}</td>
        <td>0</td>
        <td>${move_det.type}</td>
        <td>${move_det.damage_class}</td>
        <td>${move_det.power}</td>
        <td>${move_det.accuracy}</td>
        <td>${move_det.pp}</td>
        <td>${move_det.effect_entry}</td>
        <td>${move_det.target}</td>
        <td>${move_det.priority}</td>
        `
        b.innerHTML = data

        mac.appendChild(b)
      }
    }

    if (egg != []) {
      let e = document.querySelector("#egg")
      e.innerHTML = ""
      let title = document.createElement("tr")
      title.innerHTML = "<td colspan='10'>Egg</td>"
      let header = document.createElement("tr")
      header.innerHTML = "<th>Name</th><th>level_req</th><th>Type</th><th>Dmg_Class</th><th>Power</th><th>Accuracy</th><th>PP</th><th>Effect</th><th>Target</th><th>Priority</th>"
      e.appendChild(title)
      e.appendChild(header)
      for (let i = 0; i < egg.length; i++) {
        let move_det = await get_move_details(egg[i])
        let b = document.createElement("tr")
        b.classList.add("moves")
        let data = 
        `
        <td>${egg[i]}</td>
        <td>0</td>
        <td>${move_det.type}</td>
        <td>${move_det.damage_class}</td>
        <td>${move_det.power}</td>
        <td>${move_det.accuracy}</td>
        <td>${move_det.pp}</td>
        <td>${move_det.effect_entry}</td>
        <td>${move_det.target}</td>
        <td>${move_det.priority}</td>
        `
        b.innerHTML = data
        egg.appendChild(b)
      }
    }


    if (special != []) {
      let s = document.querySelector("#special")
      s.innerHTML = ""
      let title = document.createElement("tr")
      title.innerHTML = "<td colspan='10'>Special</td>"
      let header = document.createElement("tr")
      header.innerHTML = "<th>Name</th><th>level_req</th><th>Type</th><th>Dmg_Class</th><th>Power</th><th>Accuracy</th><th>PP</th><th>Effect</th><th>Target</th><th>Priority</th>"
      s.appendChild(title)
      s.appendChild(header)
      for (let i = 0; i < special.length; i++) {
        let move_det = await get_move_details(special[i])
        let b = document.createElement("tr")
        b.classList.add("moves")
        let data = 
        `
        <td>${special[i]}</td>
        <td>0</td>
        <td>${move_det.type}</td>
        <td>${move_det.damage_class}</td>
        <td>${move_det.power}</td>
        <td>${move_det.accuracy}</td>
        <td>${move_det.pp}</td>
        <td>${move_det.effect_entry}</td>
        <td>${move_det.target}</td>
        <td>${move_det.priority}</td>
        `
        b.innerHTML = data
        s.appendChild(b)
      }
    }
  }



}


async function get_move_details(move) {
  var details = await invoke("get_moves_details", { moveName: move });
  console.log(details)
  return details
}