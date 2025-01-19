

use reqwest::Response;
use rustemon::pokemon::type_;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::Path;
use tauri::http::response;
use tauri::utils::config::parse;

#[derive(Deserialize)]
struct Type {
    #[serde(rename = "type")]
    type_info: TypeInfo,
}

#[derive(Deserialize)]
struct TypeInfo {
    name: String,
}

#[derive(Deserialize)]
struct PokemonInfo {
    name: String,
}

#[derive(Deserialize)]
struct ListResponse {
    results: Vec<PokemonInfo>,
}

#[derive(serde::Deserialize, serde::Serialize)]
struct NameResponse {
    names: Vec<String>,
}

#[derive(Deserialize)]
struct Ability {
    ability: AbilityInfo,
    is_hidden: bool,
}

#[derive(Deserialize)]
struct AbilityInfo {
    name: String,
}

#[derive(Deserialize)]
struct Sprites {
    front_default: Option<String>,
    front_shiny: Option<String>,
    back_default: Option<String>,
    back_shiny: Option<String>,
}

#[derive(Deserialize)]
struct evo_forms {
    sprites: Sprites,
}

#[derive(serde::Serialize)]
struct evo_img {
    sprite: String,
}

#[derive(Deserialize)]
struct ApiResponse {
    types: Vec<Type>,
    abilities: Vec<Ability>,
    stats: Vec<stats>,
    id: i32,
    sprites: Sprites,
}

#[derive(serde::Serialize)]
struct PokemonDetails {
    id: i32,
    abilities: Vec<String>,
    types: Vec<String>,
    stats: Vec<String>,
    sprites: Vec<String>,
}

#[derive(Deserialize)]
struct stat {
    name: String,
}

#[derive(Deserialize)]
struct stats {
    stat: stat,
    base_stat: i32,
}

#[derive(Deserialize)]
struct pokemon_form {
    name: String,
    url: String,
}

#[derive(Deserialize)]
struct pokemon_variety {
    pokemon: pokemon_form,
    is_default: bool,
}

#[derive(Deserialize)]
struct pokemonFormsAndEvos {
    varieties: Vec<pokemon_variety>,
    evolution_chain: evo_chain,
}

#[derive(Deserialize)]
struct evo_chain {
    url: String,
}

#[derive(serde::Serialize)]
struct jsFormsAndEvos {
    varieties: Vec<String>,
    evos: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct EvolutionDetail {
    pub gender: Option<i32>,
    pub held_item: Option<Item>,
    pub item: Option<Item>,
    pub known_move: Option<Item>,
    pub known_move_type: Option<Item>,
    pub location: Option<Location>,
    pub min_affection: Option<i32>,
    pub min_beauty: Option<i32>,
    pub min_happiness: Option<i32>,
    pub min_level: Option<i32>,
    pub needs_overworld_rain: bool,
    pub time_of_day: String,
    pub trade_species: Option<Species>,
    pub trigger: Trigger,
    pub turn_upside_down: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Item {
    pub name: String,
    pub url: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Location {
    pub name: String,
    pub url: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Trigger {
    pub name: String,
    pub url: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Species {
    pub name: String,
    pub url: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Chain {
    pub species: Species,
    pub evolution_details: Vec<EvolutionDetail>,
    pub evolves_to: Vec<Chain>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct EvolutionChain {
    pub baby_trigger_item: Option<serde_json::Value>,
    pub chain: Chain,
    pub id: i32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct EvolutionNode {
    pub species_name: String,
    pub evolution_details: Vec<EvolutionDetail>,
    pub evolves_to: Vec<EvolutionNode>,
}

#[derive(Deserialize)]
struct r#move {
    name: String,
    url: String,
}

#[derive(Deserialize, Debug)]
struct version_group {
    name: String,
    url: String,
}

#[derive(Deserialize, Debug)]
struct move_learn_method {
    name: String,
    url: String,
}

#[derive(Deserialize)]
struct version_group_detail {
    level_learned_at: i32,
    move_learn_method: move_learn_method,
    version_group: version_group,
}

#[derive(Deserialize)]
struct moves_one {
    r#move: r#move,
    version_group_details: Vec<version_group_detail>,
}

#[derive(Deserialize)]
struct Moves {
    moves: Vec<moves_one>,
}

#[derive(serde::Serialize)]
struct moves_js {
    move_details: HashMap<String, Vec<Vec<String>>>, 
}

#[derive(Deserialize)]
struct versions {
    results: Vec<Item>,
}

#[derive(serde::Serialize)]
struct version_Js {
    versions: Vec<String>,
}

#[derive(Deserialize)]
struct damage_class {
    name: String,
}

#[derive(Deserialize)]
struct past_value {
    accuracy: Option<i32>,
    effect_chance: Option<i32>,
    power: Option<i32>,
    pp: Option<i32>,
    r#type: Option<TypeInfo>,
    version_group: version_group,
}

#[derive(Deserialize)]
struct effect_entry {
    effect: String,
    short_effect: String,
}

#[derive(Deserialize)]
struct stat_change {
    change: i32,
    stat: stat,
}

#[derive(Deserialize)]
struct move_info {
    accuracy: Option<i32>,
    damage_class: damage_class,
    effect_entries: Vec<effect_entry>,
    name: String,
    past_values: Vec<past_value>,
    power: Option<i32>,
    pp: i32,
    priority: i32,
    stat_changes: Vec<stat_change>,
    target: Item,
    r#type: TypeInfo,
}

#[derive(serde::Serialize)]
struct move_info_js {
    accuracy: Option<i32>,
    damage_class: String,
    effect_entry: String,
    name: String,
    past_values: Option<Vec<Vec<String>>>,
    power: i32,
    pp: i32,
    priority: i32,
    stat_changes: Option<Vec<Vec<String>>>,
    target: String,
    r#type: String,
}

#[tauri::command]
fn parse_evolution_chain(raw_json: String) -> Result<EvolutionChain, String> {
    serde_json::from_str::<EvolutionChain>(&raw_json)
        .map_err(|err| format!("Failed to parse JSON: {}", err))
}

#[tauri::command]
async fn read_pokemons() -> Result<Vec<String>, String> {
    let file_path = "pokemons.json";

    if Path::new(file_path).exists() {
        match fs::read_to_string(file_path) {
            Ok(file_content) => match serde_json::from_str::<NameResponse>(&file_content) {
                Ok(name_response) => Ok(name_response.names),
                Err(_) => Err("Failed to parse JSON from file.".to_string()),
            },
            Err(_) => Err("Failed to read the Pokémon file.".to_string()),
        }
    } else {
        match get_pokemon_list().await {
            Ok(poke_names) => {
                match fs::write(file_path, serde_json::to_string(&poke_names).unwrap()) {
                    Ok(_) => Ok(poke_names.names),
                    Err(_) => Err("Failed to write to the Pokémon file.".to_string()),
                }
            }
            Err(err) => Err(err),
        }
    }
}

#[tauri::command]
async fn get_versions() -> Result<version_Js, String> {
    let url = format!("https://pokeapi.co/api/v2/version-group/?limit=27");
    match reqwest::get(&url).await {
        Ok(response) => match response.json::<versions>().await {
            Ok(parsed) => {
                let versions = parsed.results.into_iter().map(|re| re.name).collect();
                let vers = version_Js { versions };
                Ok(vers)
            }
            Err(_) => Err("Failed to get versions".to_string()),
        },
        Err(_) => Err("Failed to make request to versions".to_string()),
    }
}

#[tauri::command]
async fn get_evo_sprite(pokemon_name: String) -> Result<evo_img, String> {
    let url = format!("https://pokeapi.co/api/v2/pokemon/{}/", pokemon_name);
    match reqwest::get(&url).await {
        Ok(response) => match response.json::<evo_forms>().await {
            Ok(parsed) => {
                let evo_sprites = parsed.sprites.front_default.unwrap_or_default();

                let evo_forms = evo_img {
                    sprite: evo_sprites,
                };
                Ok(evo_forms)
            }
            Err(_) => Err("Failed to parse response from API evos".to_string()),
        },
        Err(_) => Err("Failed to make a request to the API evos".to_string()),
    }
}

#[tauri::command]
async fn get_pokemon_forms(pokemon_name: String) -> Result<jsFormsAndEvos, String> {
    let url = format!(
        "https://pokeapi.co/api/v2/pokemon-species/{}/",
        pokemon_name
    );
    match reqwest::get(&url).await {
        Ok(response) => match response.json::<pokemonFormsAndEvos>().await {
            Ok(parsed) => {
                let forms = parsed
                    .varieties
                    .into_iter()
                    .map(|f| f.pokemon.name)
                    .collect();

                let poke_forms = jsFormsAndEvos {
                    varieties: forms,
                    evos: parsed.evolution_chain.url,
                };
                Ok(poke_forms)
            }
            Err(_) => Err("Failed to parse response from API species".to_string()),
        },
        Err(_) => Err("Failed to make a request to the API species".to_string()),
    }
}

#[tauri::command]
async fn get_pokemon_types(pokemon_name: String) -> Result<PokemonDetails, String> {
    let url = format!("https://pokeapi.co/api/v2/pokemon/{}/", pokemon_name);

    match reqwest::get(&url).await {
        Ok(response) => match response.json::<ApiResponse>().await {
            Ok(parsed) => {
                let types = parsed.types.into_iter().map(|t| t.type_info.name).collect();
                let abilities = parsed
                    .abilities
                    .into_iter()
                    .map(|a| a.ability.name + " " + &a.is_hidden.to_string())
                    .collect();
                let all_stats = parsed
                    .stats
                    .into_iter()
                    .map(|s| s.stat.name + " " + &s.base_stat.to_string())
                    .collect();
                let sprites = vec![
                    parsed.sprites.front_default.unwrap_or_default(),
                    parsed.sprites.front_shiny.unwrap_or_default(),
                    parsed.sprites.back_default.unwrap_or_default(),
                    parsed.sprites.back_shiny.unwrap_or_default(),
                ];
                let details = PokemonDetails {
                    id: parsed.id,
                    abilities,
                    types,
                    sprites,
                    stats: all_stats,
                };
                Ok(details)
            }
            Err(_) => Err("Failed to parse the response from the API.".to_string()),
        },
        Err(_) => Err("Failed to make a request to the API.".to_string()),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            get_pokemon_types,
            read_pokemons,
            get_pokemon_forms,
            parse_evolution_chain,
            get_evo_sprite,
            fetch_raw_json,
            get_species_names,
            parse_evolution_detail,
            parse_moves,
            get_versions,
            get_moves_details
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

async fn get_pokemon_list() -> Result<NameResponse, String> {
    let url = "https://pokeapi.co/api/v2/pokemon?limit=1302&offset=0";

    match reqwest::get(url).await {
        Ok(response) => match response.json::<ListResponse>().await {
            Ok(parsed) => {
                let names = parsed.results.into_iter().map(|p| p.name).collect();
                let poke_names = NameResponse { names };
                Ok(poke_names)
            }
            Err(_) => Err("Failed to parse Pokémon list.".to_string()),
        },
        Err(_) => Err("Failed to fetch Pokémon list.".to_string()),
    }
}

#[tauri::command]
async fn fetch_raw_json(chain_url: String) -> Result<String, String> {
    match reqwest::get(&chain_url).await {
        Ok(response) => match response.text().await {
            Ok(json) => Ok(json),
            Err(_) => Err("Failed to read the API response.".to_string()),
        },
        Err(_) => Err("Failed to fetch the API response.".to_string()),
    }
}

#[tauri::command]
fn get_species_names(raw_json: String) -> Result<Vec<String>, String> {
    let evolution_chain: EvolutionChain =
        serde_json::from_str(&raw_json).map_err(|err| format!("Failed to parse JSON: {}", err))?;

    fn collect_species_names(evolution: &Chain, species_names: &mut Vec<String>) {
        species_names.push(evolution.species.name.clone());

        for next_evolution in &evolution.evolves_to {
            collect_species_names(next_evolution, species_names);
        }
    }

    let mut species_names = Vec::new();
    collect_species_names(&evolution_chain.chain, &mut species_names);

    Ok(species_names)
}

#[tauri::command]
fn parse_evolution_detail(raw_json: String) -> Result<EvolutionNode, String> {
    let evolution_chain: EvolutionChain =
        serde_json::from_str(&raw_json).map_err(|err| format!("Failed to parse JSON: {}", err))?;

    fn build_evolution_node(chain: &Chain) -> EvolutionNode {
        EvolutionNode {
            species_name: chain.species.name.clone(),
            evolution_details: chain.evolution_details.clone(),
            evolves_to: chain.evolves_to.iter().map(build_evolution_node).collect(),
        }
    }

    Ok(build_evolution_node(&evolution_chain.chain))
}

#[tauri::command]
async fn parse_moves(pokemon_name: String) -> Result<moves_js, String> {
    
    let url = format!("https://pokeapi.co/api/v2/pokemon/{}/", pokemon_name);

    match reqwest::get(&url).await {
        Ok(response) => {
            match response.json::<Moves>().await {
                Ok(parsed) => {
                    let move_details: HashMap<String, Vec<Vec<String>>> = parsed
                        .moves
                        .into_iter()
                        .map(|m| {
                            let version_details: Vec<Vec<String>> = m
                                .version_group_details
                                .into_iter()
                                .map(|f| {
                                    vec![
                                        f.level_learned_at.to_string(),
                                        f.move_learn_method.name.clone(),
                                        f.version_group.name.clone(),
                                    ]
                                })
                                .collect();
                            (m.r#move.name, version_details)
                        })
                        .collect();

                    let js_moves = moves_js { move_details };

                    Ok(js_moves)
                }
                Err(err) => Err(format!("Failed to parse JSON response: {}", err)),
            }
        }
        Err(err) => Err(format!("Failed to fetch Pokémon data: {}", err)),
    }
}

#[tauri::command]
async fn get_moves_details(move_name: String) -> Result<move_info_js, String> {
    let url = format!("https://pokeapi.co/api/v2/move/{}/", move_name);
    match reqwest::get(&url).await {
        Ok(response) => match response.json::<move_info>().await {
            Ok(parsed) => {
                let past: Option<Vec<Vec<String>>> = if parsed.past_values.is_empty() {
                    None
                } else {
                    Some(
                        parsed
                            .past_values
                            .into_iter()
                            .map(|p| {
                                vec![
                                    p.accuracy.map_or("None".to_string(), |v| v.to_string()),
                                    p.effect_chance
                                        .map_or("None".to_string(), |v| v.to_string()),
                                    p.power.map_or("None".to_string(), |v| v.to_string()),
                                    p.pp.map_or("None".to_string(), |v| v.to_string()),
                                    p.r#type
                                        .map(|type_info| type_info.name.clone())
                                        .unwrap_or_else(|| "None".to_string()),
                                    p.version_group.name,
                                ]
                            })
                            .collect(),
                    )
                };

                let change: Option<Vec<Vec<String>>> = parsed
                    .stat_changes
                    .into_iter()
                    .map(|c| Some(vec![c.change.to_string(), c.stat.name]))
                    .collect();

                let js_info = move_info_js {
                    accuracy: parsed.accuracy,
                    damage_class: parsed.damage_class.name,
                    effect_entry: parsed.effect_entries[0].short_effect.clone(),
                    name: parsed.name,
                    past_values: past,
                    power: parsed.power.unwrap_or_default(),
                    pp: parsed.pp,
                    priority: parsed.priority,
                    stat_changes: change,
                    target: parsed.target.name,
                    r#type: parsed.r#type.name,
                };
                Ok(js_info)
            }
            Err(err) => Err(format!("failed to parse move info: {}", err)),
        },
        Err(err) => Err(format!("Failed to make request to move: {}", err)),
    }
}
