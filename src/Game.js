// src/Game.js
import { INVALID_MOVE } from 'boardgame.io/core';

const connections = {
  // Histórico (ATUALIZADO: Saúde e Rio Comprido agora se conectam)
  'N01_Centro': ['N02_Lapa', 'N03_Saude', 'N05_GloriaBotafogo', 'N31_CentroNit'], 
  'N02_Lapa': ['N01_Centro', 'N03_Saude', 'N04_RioComprido', 'N05_GloriaBotafogo'], 
  'N03_Saude': ['N01_Centro', 'N02_Lapa', 'N04_RioComprido', 'N10_SaoCristovao'], // Adicionado N04
  'N04_RioComprido': ['N02_Lapa', 'N03_Saude', 'N09_GrandeTijuca', 'N10_SaoCristovao'], // Adicionado N03
  
  // Zona Sul
  'N05_GloriaBotafogo': ['N01_Centro', 'N02_Lapa', 'N06_Copacabana'], 
  'N06_Copacabana': ['N05_GloriaBotafogo', 'N07_IpanemaLeblon'], 
  'N07_IpanemaLeblon': ['N06_Copacabana', 'N08_RocinhaGavea'], 
  'N08_RocinhaGavea': ['N07_IpanemaLeblon', 'N16_BarraTijuca'],
  
  // Zona Norte
  'N09_GrandeTijuca': ['N04_RioComprido', 'N10_SaoCristovao', 'N12_GrandeMeier'],
  'N10_SaoCristovao': ['N03_Saude', 'N04_RioComprido', 'N09_GrandeTijuca', 'N11_ComplexoAlemao', 'N12_GrandeMeier'],
  'N11_ComplexoAlemao': ['N10_SaoCristovao', 'N12_GrandeMeier', 'N13_Madureira', 'N14_Pavuna', 'N15_IlhaGovernador'],
  'N12_GrandeMeier': ['N09_GrandeTijuca', 'N10_SaoCristovao', 'N11_ComplexoAlemao', 'N13_Madureira'],
  'N13_Madureira': ['N11_ComplexoAlemao', 'N12_GrandeMeier', 'N14_Pavuna', 'N17_Jacarepagua', 'N18_Bangu'], 
  'N14_Pavuna': ['N11_ComplexoAlemao', 'N13_Madureira', 'N18_Bangu', 'N22_DuqueCaxias', 'N23_SaoJoaoMeriti', 'N24_Nilopolis'], 
  'N15_IlhaGovernador': ['N11_ComplexoAlemao', 'N22_DuqueCaxias'],
  
  // Zona Oeste
  'N16_BarraTijuca': ['N08_RocinhaGavea', 'N17_Jacarepagua', 'N21_Guaratiba'],
  'N17_Jacarepagua': ['N13_Madureira', 'N16_BarraTijuca', 'N18_Bangu'], 
  'N18_Bangu': ['N13_Madureira', 'N14_Pavuna', 'N17_Jacarepagua', 'N19_CampoGrande'], 
  'N19_CampoGrande': ['N18_Bangu', 'N20_SantaCruz', 'N21_Guaratiba', 'N27_NovaIguacu'], 
  'N20_SantaCruz': ['N19_CampoGrande', 'N21_Guaratiba', 'N29_Japeri'], 
  'N21_Guaratiba': ['N16_BarraTijuca', 'N19_CampoGrande', 'N20_SantaCruz'],
  
  // Baixada Fluminense
  'N22_DuqueCaxias': ['N23_SaoJoaoMeriti', 'N26_BelfordRoxo', 'N30_Mage', 'N15_IlhaGovernador', 'N14_Pavuna'],
  'N23_SaoJoaoMeriti': ['N22_DuqueCaxias', 'N24_Nilopolis', 'N26_BelfordRoxo', 'N14_Pavuna'],
  'N24_Nilopolis': ['N23_SaoJoaoMeriti', 'N25_Mesquita', 'N14_Pavuna'],
  'N25_Mesquita': ['N24_Nilopolis', 'N27_NovaIguacu'],
  'N26_BelfordRoxo': ['N22_DuqueCaxias', 'N23_SaoJoaoMeriti', 'N27_NovaIguacu'],
  'N27_NovaIguacu': ['N25_Mesquita', 'N26_BelfordRoxo', 'N28_Queimados', 'N19_CampoGrande'],
  'N28_Queimados': ['N27_NovaIguacu', 'N29_Japeri'],
  'N29_Japeri': ['N27_NovaIguacu', 'N28_Queimados', 'N20_SantaCruz'],
  'N30_Mage': ['N22_DuqueCaxias', 'N42_Guaxindiba'], 
  
  // Leste Fluminense (ATUALIZADO: Região Oceânica com rota dupla, Pendotiba <-> Neves ativada)
  'N31_CentroNit': ['N32_Icarai', 'N35_Fonseca', 'N01_Centro', 'N36_Engenhoca'], 
  'N32_Icarai': ['N31_CentroNit', 'N33_RegiaoOceanica', 'N34_Pendotiba', 'N36_Engenhoca'],
  'N33_RegiaoOceanica': ['N32_Icarai', 'N34_Pendotiba'],
  'N34_Pendotiba': ['N32_Icarai', 'N33_RegiaoOceanica', 'N36_Engenhoca', 'N37_Neves', 'N38_ZeGaroto'], // Adicionado N37
  'N35_Fonseca': ['N31_CentroNit', 'N36_Engenhoca', 'N37_Neves'],
  'N36_Engenhoca': ['N31_CentroNit', 'N32_Icarai', 'N34_Pendotiba', 'N35_Fonseca', 'N37_Neves'],
  'N37_Neves': ['N34_Pendotiba', 'N35_Fonseca', 'N36_Engenhoca', 'N38_ZeGaroto'], // Adicionado N34
  'N38_ZeGaroto': ['N34_Pendotiba', 'N37_Neves', 'N39_Mutua'],
  'N39_Mutua': ['N38_ZeGaroto', 'N40_Alcantara', 'N41_JardimCatarina'], 
  'N40_Alcantara': ['N39_Mutua', 'N41_JardimCatarina', 'N42_Guaxindiba'],
  'N41_JardimCatarina': ['N39_Mutua', 'N40_Alcantara', 'N42_Guaxindiba'],
  'N42_Guaxindiba': ['N40_Alcantara', 'N41_JardimCatarina', 'N30_Mage'] 
};

export const territoryNames = {
  'N01_Centro': 'Centro', 'N02_Lapa': 'Lapa', 'N03_Saude': 'Saúde', 'N04_RioComprido': 'Rio Comprido',
  'N05_GloriaBotafogo': 'Glória/Botafogo', 'N06_Copacabana': 'Copacabana', 'N07_IpanemaLeblon': 'Ipanema/Leblon', 'N08_RocinhaGavea': 'Rocinha/Gávea',
  'N09_GrandeTijuca': 'Grande Tijuca', 'N10_SaoCristovao': 'São Cristóvão', 'N11_ComplexoAlemao': 'Complexo do Alemão', 'N12_GrandeMeier': 'Grande Méier',
  'N13_Madureira': 'Madureira', 'N14_Pavuna': 'Pavuna', 'N15_IlhaGovernador': 'Ilha do Governador',
  'N16_BarraTijuca': 'Barra da Tijuca', 'N17_Jacarepagua': 'Jacarepaguá', 'N18_Bangu': 'Bangu', 'N19_CampoGrande': 'Campo Grande',
  'N20_SantaCruz': 'Santa Cruz', 'N21_Guaratiba': 'Guaratiba',
  'N22_DuqueCaxias': 'Duque de Caxias', 'N23_SaoJoaoMeriti': 'São João de Meriti', 'N24_Nilopolis': 'Nilópolis',
  'N25_Mesquita': 'Mesquita', 'N26_BelfordRoxo': 'Belford Roxo', 'N27_NovaIguacu': 'Nova Iguaçu',
  'N28_Queimados': 'Queimados', 'N29_Japeri': 'Japeri', 'N30_Mage': 'Magé',
  'N31_CentroNit': 'Centro (Niterói)', 'N32_Icarai': 'Icaraí', 'N33_RegiaoOceanica': 'Região Oceânica',
  'N34_Pendotiba': 'Pendotiba', 'N35_Fonseca': 'Fonseca', 'N36_Engenhoca': 'Engenhoca',
  'N37_Neves': 'Neves', 'N38_ZeGaroto': 'Zé Garoto', 'N39_Mutua': 'Mutuá',
  'N40_Alcantara': 'Alcântara', 'N41_JardimCatarina': 'Jardim Catarina', 'N42_Guaxindiba': 'Guaxindiba'
};

export const WarRio = {
  name: 'war-metropole-fluminense',
  
  setup: ({ random }) => {
    const tKeys = Object.keys(connections);
    const shuffledTerritories = random.Shuffle(tKeys);
    let initialTerritories = {};
    
    shuffledTerritories.forEach((id, index) => {
      initialTerritories[id] = { owner: (index % 4).toString(), armies: 1 };
    });

    const playerIDs = ['0', '1', '2', '3'];
    let objectives = [
        {id: 'OB_01', type: 'continent', continent: 'Historico'}, {id: 'OB_02', type: 'continent', continent: 'ZonaSul'},
        {id: 'OB_ZN', type: 'continent', continent: 'ZonaNorte'}, {id: 'OB_ZO', type: 'continent', continent: 'ZonaOeste'},
        {id: 'OB_BX', type: 'continent', continent: 'Baixada'}, {id: 'OB_LS', type: 'continent', continent: 'Leste'},
        {id: 'OB_D_0', type: 'destroy', target: '0'}, {id: 'OB_D_1', type: 'destroy', target: '1'},
        {id: 'OB_D_2', type: 'destroy', target: '2'}, {id: 'OB_D_3', type: 'destroy', target: '3'}
    ];
    
    let assignments = {};
    let valid = false;
    while(!valid) {
      objectives = random.Shuffle(objectives);
      valid = true;
      assignments = {};
      for(let i=0; i<playerIDs.length; i++) {
        const pId = playerIDs[i];
        const obj = objectives[i];
        if(obj.type === 'destroy' && obj.target === pId) {
          valid = false; break; 
        }
        assignments[pId] = obj;
      }
    }

    // A MÁGICA: Embaralhamos as facções para garantir ordem de jogo 100% aleatória!
    const baseFactions = [
      { faction: 'CV', color: '#ff3333' },
      { faction: 'TCP', color: '#33cc33' },
      { faction: 'ADA', color: '#ffcc00' },
      { faction: 'Milícia', color: '#3366ff' }
    ];
    const shuffledFactions = random.Shuffle(baseFactions);

    return {
      territories: initialTerritories,
      connections, 
      continents: {
        'Historico': { name: 'Núcleo Histórico', territories: ['N01_Centro', 'N02_Lapa', 'N03_Saude', 'N04_RioComprido'], bonus: 2 },
        'ZonaSul': { name: 'Zona Sul', territories: ['N05_GloriaBotafogo', 'N06_Copacabana', 'N07_IpanemaLeblon', 'N08_RocinhaGavea'], bonus: 2 },
        'ZonaNorte': { name: 'Zona Norte', territories: ['N09_GrandeTijuca', 'N10_SaoCristovao', 'N11_ComplexoAlemao', 'N12_GrandeMeier', 'N13_Madureira', 'N14_Pavuna', 'N15_IlhaGovernador'], bonus: 5 },
        'ZonaOeste': { name: 'Zona Oeste', territories: ['N16_BarraTijuca', 'N17_Jacarepagua', 'N18_Bangu', 'N19_CampoGrande', 'N20_SantaCruz', 'N21_Guaratiba'], bonus: 3 },
        'Baixada': { name: 'Baixada Fluminense', territories: ['N22_DuqueCaxias', 'N23_SaoJoaoMeriti', 'N24_Nilopolis', 'N25_Mesquita', 'N26_BelfordRoxo', 'N27_NovaIguacu', 'N28_Queimados', 'N29_Japeri', 'N30_Mage'], bonus: 5 },
        'Leste': { name: 'Leste Fluminense', territories: ['N31_CentroNit', 'N32_Icarai', 'N33_RegiaoOceanica', 'N34_Pendotiba', 'N35_Fonseca', 'N36_Engenhoca', 'N37_Neves', 'N38_ZeGaroto', 'N39_Mutua', 'N40_Alcantara', 'N41_JardimCatarina', 'N42_Guaxindiba'], bonus: 7 }
      },
      deck: [
        { id: 'N01_Centro', shape: 'Triângulo' }, { id: 'N02_Lapa', shape: 'Quadrado' }, { id: 'N03_Saude', shape: 'Círculo' }, { id: 'N04_RioComprido', shape: 'Triângulo' }, { id: 'N05_GloriaBotafogo', shape: 'Quadrado' }, { id: 'N06_Copacabana', shape: 'Círculo' }, { id: 'N07_IpanemaLeblon', shape: 'Triângulo' }, { id: 'N08_RocinhaGavea', shape: 'Quadrado' },
        { id: 'N09_GrandeTijuca', shape: 'Círculo' }, { id: 'N10_SaoCristovao', shape: 'Triângulo' }, { id: 'N11_ComplexoAlemao', shape: 'Quadrado' }, { id: 'N12_GrandeMeier', shape: 'Círculo' }, { id: 'N13_Madureira', shape: 'Triângulo' }, { id: 'N14_Pavuna', shape: 'Quadrado' }, { id: 'N15_IlhaGovernador', shape: 'Círculo' },
        { id: 'N16_BarraTijuca', shape: 'Triângulo' }, { id: 'N17_Jacarepagua', shape: 'Quadrado' }, { id: 'N18_Bangu', shape: 'Círculo' }, { id: 'N19_CampoGrande', shape: 'Triângulo' }, { id: 'N20_SantaCruz', shape: 'Quadrado' }, { id: 'N21_Guaratiba', shape: 'Círculo' },
        { id: 'N22_DuqueCaxias', shape: 'Triângulo' }, { id: 'N23_SaoJoaoMeriti', shape: 'Quadrado' }, { id: 'N24_Nilopolis', shape: 'Círculo' }, { id: 'N25_Mesquita', shape: 'Triângulo' }, { id: 'N26_BelfordRoxo', shape: 'Quadrado' }, { id: 'N27_NovaIguacu', shape: 'Círculo' }, { id: 'N28_Queimados', shape: 'Triângulo' }, { id: 'N29_Japeri', shape: 'Quadrado' }, { id: 'N30_Mage', shape: 'Círculo' },
        { id: 'N31_CentroNit', shape: 'Triângulo' }, { id: 'N32_Icarai', shape: 'Quadrado' }, { id: 'N33_RegiaoOceanica', shape: 'Círculo' }, { id: 'N34_Pendotiba', shape: 'Triângulo' }, { id: 'N35_Fonseca', shape: 'Quadrado' }, { id: 'N36_Engenhoca', shape: 'Círculo' }, { id: 'N37_Neves', shape: 'Triângulo' }, { id: 'N38_ZeGaroto', shape: 'Quadrado' }, { id: 'N39_Mutua', shape: 'Círculo' }, { id: 'N40_Alcantara', shape: 'Triângulo' }, { id: 'N41_JardimCatarina', shape: 'Quadrado' }, { id: 'N42_Guaxindiba', shape: 'Círculo' },
        { id: 'Coringa', shape: 'Coringa' }, { id: 'Coringa2', shape: 'Coringa' }
      ],
      // Os jogadores assumem as facções sorteadas
      players: {
        '0': { faction: shuffledFactions[0].faction, color: shuffledFactions[0].color, cards: [], conqueredThisTurn: false, eliminated: false, objective: assignments['0'] },   
        '1': { faction: shuffledFactions[1].faction, color: shuffledFactions[1].color, cards: [], conqueredThisTurn: false, eliminated: false, objective: assignments['1'] },
        '2': { faction: shuffledFactions[2].faction, color: shuffledFactions[2].color, cards: [], conqueredThisTurn: false, eliminated: false, objective: assignments['2'] },
        '3': { faction: shuffledFactions[3].faction, color: shuffledFactions[3].color, cards: [], conqueredThisTurn: false, eliminated: false, objective: assignments['3'] }
      },
      troopsToPlace: 0, 
      tradeCount: 0, 
      lastCombat: null,
      pendingOccupation: null,
      log: [{ faction: 'SISTEMA', color: '#ffdd55', msg: 'As comunicações foram estabelecidas. A guerra começou!' }]
    };
  },

  phases: {
    // FASE ZERO: O motor segue o relógio normal, mas essa fase acaba rigorosamente após os 4 passarem.
    initialReinforcement: {
      start: true,
      next: 'main',
      turn: {
        onBegin: ({ G, ctx }) => {
          const ownedTerritories = Object.values(G.territories).filter(t => t.owner === ctx.currentPlayer).length;
          G.troopsToPlace = Math.max(3, Math.floor(ownedTerritories / 2));
          Object.values(G.continents).forEach(continent => {
            const ownsAll = continent.territories.every(tId => G.territories[tId].owner === ctx.currentPlayer);
            if (ownsAll) G.troopsToPlace += continent.bonus;
          });
        },
        activePlayers: { currentPlayer: 'reinforcement' },
        stages: {
          reinforcement: {
            moves: {
              placeArmy: ({ G, ctx }, territoryId) => {
                if (G.territories[territoryId].owner !== ctx.currentPlayer) return INVALID_MOVE;
                if (G.troopsToPlace <= 0) return INVALID_MOVE;
                G.territories[territoryId].armies += 1;
                G.troopsToPlace -= 1; 
              }
            }
          }
        }
      },
      // CORREÇÃO CRUCIAL: Só avança após o 4º turno ter sido concluído por inteiro.
      endIf: ({ ctx }) => ctx.turn > 4, 
    },

    // FASE DE GUERRA
    main: {
      turn: {
        onBegin: ({ G, ctx }) => {
          const ownedTerritories = Object.values(G.territories).filter(t => t.owner === ctx.currentPlayer).length;
          if (ownedTerritories === 0) {
            G.players[ctx.currentPlayer].eliminated = true;
            G.troopsToPlace = 0; 
            return; 
          }
          G.troopsToPlace = Math.max(3, Math.floor(ownedTerritories / 2));
          Object.values(G.continents).forEach(continent => {
            const ownsAll = continent.territories.every(tId => G.territories[tId].owner === ctx.currentPlayer);
            if (ownsAll) G.troopsToPlace += continent.bonus;
          });
        },
        onEnd: ({ G, ctx, random }) => {
          const player = G.players[ctx.currentPlayer];
          if (player.conqueredThisTurn && G.deck.length > 0) {
            G.deck = random.Shuffle(G.deck);
            const drawnCard = G.deck.pop();
            player.cards.push(drawnCard);
          }
          player.conqueredThisTurn = false;
          G.lastCombat = null; 
          G.pendingOccupation = null;
        },
        activePlayers: { currentPlayer: 'reinforcement' },
        
        stages: {
          reinforcement: {
            moves: {
              placeArmy: ({ G, ctx }, territoryId) => {
                if (G.territories[territoryId].owner !== ctx.currentPlayer) return INVALID_MOVE;
                if (G.troopsToPlace <= 0) return INVALID_MOVE;
                G.territories[territoryId].armies += 1;
                G.troopsToPlace -= 1; 
              },
              exchangeCards: ({ G, ctx }, cardIndices) => {
                const player = G.players[ctx.currentPlayer];
                if (cardIndices.length !== 3) return INVALID_MOVE;
                const cardsToTrade = cardIndices.map(index => player.cards[index]);
                const shapes = cardsToTrade.map(c => c.shape);
                const hasCoringa = shapes.includes('Coringa');
                const uniqueShapes = new Set(shapes.filter(s => s !== 'Coringa')).size;
                if (!(hasCoringa || uniqueShapes === 1 || uniqueShapes === 3)) return INVALID_MOVE; 

                const tradeValues = [4, 6, 8, 10, 12, 15];
                let armiesReceived = G.tradeCount < 6 ? tradeValues[G.tradeCount] : 15 + ((G.tradeCount - 5) * 5);

                cardsToTrade.forEach(card => {
                  if (card.id !== 'Coringa' && G.territories[card.id]?.owner === ctx.currentPlayer) G.territories[card.id].armies += 2;
                });
                G.troopsToPlace += armiesReceived;
                G.tradeCount += 1;
                player.cards = player.cards.filter((_, index) => !cardIndices.includes(index));

                G.log.push({
                  faction: player.faction,
                  color: player.color,
                  msg: `trocou 3 cartas por +${armiesReceived} reforços.`
                });
              }
            }
          },
          attack: {
            moves: {
              declareAttack: ({ G, ctx, random }, sourceId, targetId) => {
                if (G.pendingOccupation) return INVALID_MOVE; 

                const source = G.territories[sourceId];
                const target = G.territories[targetId];

                if (source.owner !== ctx.currentPlayer || source.armies < 2 || target.owner === ctx.currentPlayer || !G.connections[sourceId].includes(targetId)) return INVALID_MOVE;

                const attackDiceCount = Math.min(3, source.armies - 1);
                const defenseDiceCount = Math.min(3, target.armies);

                let attackRolls = []; for(let i=0; i<attackDiceCount; i++) attackRolls.push(random.D6()); attackRolls.sort((a,b)=>b-a);
                let defenseRolls = []; for(let i=0; i<defenseDiceCount; i++) defenseRolls.push(random.D6()); defenseRolls.sort((a,b)=>b-a);

                let attackerLosses = 0; let defenderLosses = 0;
                const comparisons = Math.min(attackDiceCount, defenseDiceCount);
                for (let i = 0; i < comparisons; i++) {
                  if (attackRolls[i] > defenseRolls[i]) defenderLosses++; else attackerLosses++; 
                }

                source.armies -= attackerLosses;
                target.armies -= defenderLosses;

                const originalTargetOwner = target.owner;
                let conquered = false;

                if (target.armies <= 0) { 
                  conquered = true; 
                  target.owner = ctx.currentPlayer;
                  target.armies = 1; 
                  source.armies -= 1;
                  G.players[ctx.currentPlayer].conqueredThisTurn = true;

                  const maxExtra = Math.min(2, source.armies - 1); 
                  if (maxExtra > 0) {
                     G.pendingOccupation = { sourceId, targetId, maxExtra };
                  }

                  G.log.push({
                    faction: G.players[ctx.currentPlayer].faction,
                    color: G.players[ctx.currentPlayer].color,
                    msg: `conquistou ${territoryNames[targetId]} da facção ${G.players[originalTargetOwner].faction}.`
                  });

                  const defenderTerritories = Object.values(G.territories).filter(t => t.owner === originalTargetOwner).length;
                  if (defenderTerritories === 0) {
                    G.players[originalTargetOwner].eliminated = true;
                    
                    G.log.push({
                      faction: 'SISTEMA',
                      color: '#ff4444',
                      msg: `💀 ALERTA: A facção ${G.players[originalTargetOwner].faction} foi ERRADICADA do jogo!`
                    });

                    Object.keys(G.players).forEach(pId => {
                      const obj = G.players[pId].objective;
                      if (obj && obj.type === 'destroy' && obj.target === originalTargetOwner && pId !== ctx.currentPlayer) {
                        G.players[pId].objective = { id: 'OB_FALLBACK', type: 'territories', count: 6 };
                        
                        G.log.push({
                          faction: 'SISTEMA',
                          color: '#ffdd55',
                          msg: `🔄 O objetivo estratégico de ${G.players[pId].faction} sofreu uma Mutação Tática!`
                        });
                      }
                    });
                  }
                }

                G.lastCombat = { type: 'CLASSIC', sourceId, targetId, attackRolls, defenseRolls, attackerLosses, defenderLosses, conquered };
              },

              blitzAttack: ({ G, ctx, random }, sourceId, targetId) => {
                if (G.pendingOccupation) return INVALID_MOVE; 

                const source = G.territories[sourceId];
                const target = G.territories[targetId];

                if (source.owner !== ctx.currentPlayer || source.armies < 2 || target.owner === ctx.currentPlayer || !G.connections[sourceId].includes(targetId)) return INVALID_MOVE;

                let totalAttackerLosses = 0;
                let totalDefenderLosses = 0;
                let rounds = 0;

                while (source.armies > 1 && target.armies > 0) {
                  rounds++;
                  const attackDiceCount = Math.min(3, source.armies - 1);
                  const defenseDiceCount = Math.min(3, target.armies);

                  let attackRolls = []; for(let i=0; i<attackDiceCount; i++) attackRolls.push(random.D6()); attackRolls.sort((a,b)=>b-a);
                  let defenseRolls = []; for(let i=0; i<defenseDiceCount; i++) defenseRolls.push(random.D6()); defenseRolls.sort((a,b)=>b-a);

                  const comparisons = Math.min(attackDiceCount, defenseDiceCount);
                  for (let i = 0; i < comparisons; i++) {
                    if (attackRolls[i] > defenseRolls[i]) {
                      target.armies--; totalDefenderLosses++;
                    } else {
                      source.armies--; totalAttackerLosses++;
                    }
                  }
                }

                const originalTargetOwner = target.owner;
                let conquered = false;

                if (target.armies === 0) {
                  conquered = true; 
                  target.owner = ctx.currentPlayer;
                  target.armies = 1; 
                  source.armies -= 1;
                  G.players[ctx.currentPlayer].conqueredThisTurn = true;

                  const maxExtra = Math.min(2, source.armies - 1); 
                  if (maxExtra > 0) {
                     G.pendingOccupation = { sourceId, targetId, maxExtra };
                  }

                  G.log.push({
                    faction: G.players[ctx.currentPlayer].faction,
                    color: G.players[ctx.currentPlayer].color,
                    msg: `conquistou ${territoryNames[targetId]} da facção ${G.players[originalTargetOwner].faction}.`
                  });

                  const defenderTerritories = Object.values(G.territories).filter(t => t.owner === originalTargetOwner).length;
                  if (defenderTerritories === 0) {
                    G.players[originalTargetOwner].eliminated = true;

                    G.log.push({
                      faction: 'SISTEMA',
                      color: '#ff4444',
                      msg: `💀 ALERTA: A facção ${G.players[originalTargetOwner].faction} foi ERRADICADA do jogo!`
                    });

                    Object.keys(G.players).forEach(pId => {
                      const obj = G.players[pId].objective;
                      if (obj && obj.type === 'destroy' && obj.target === originalTargetOwner && pId !== ctx.currentPlayer) {
                        G.players[pId].objective = { id: 'OB_FALLBACK', type: 'territories', count: 6 };

                        G.log.push({
                          faction: 'SISTEMA',
                          color: '#ffdd55',
                          msg: `🔄 O objetivo estratégico de ${G.players[pId].faction} sofreu uma Mutação Tática!`
                        });
                      }
                    });
                  }
                }

                G.lastCombat = { type: 'BLITZ', sourceId, targetId, rounds, attackerLosses: totalAttackerLosses, defenderLosses: totalDefenderLosses, conquered };
              },

              occupy: ({ G, ctx }, extra) => {
                if (!G.pendingOccupation) return INVALID_MOVE;
                if (extra < 0 || extra > G.pendingOccupation.maxExtra) return INVALID_MOVE;
                if (G.territories[G.pendingOccupation.sourceId].armies - extra < 1) return INVALID_MOVE;

                G.territories[G.pendingOccupation.sourceId].armies -= extra;
                G.territories[G.pendingOccupation.targetId].armies += extra;
                G.pendingOccupation = null; 
              }
            }
          },
          maneuver: {
            moves: {
              moveArmy: ({ G, ctx }, sourceId, targetId) => {
                if (G.territories[sourceId].owner !== ctx.currentPlayer) return INVALID_MOVE;
                if (G.territories[targetId].owner !== ctx.currentPlayer) return INVALID_MOVE;
                if (G.territories[sourceId].armies < 2) return INVALID_MOVE;

                const visited = new Set();
                const queue = [sourceId];
                let pathFound = false;

                while (queue.length > 0) {
                  const current = queue.shift();
                  if (current === targetId) { pathFound = true; break; }
                  visited.add(current);
                  
                  const neighbors = G.connections[current] || [];
                  for (const neighbor of neighbors) {
                    if (G.territories[neighbor].owner === ctx.currentPlayer && !visited.has(neighbor)) {
                      queue.push(neighbor);
                      visited.add(neighbor); 
                    }
                  }
                }

                if (!pathFound) return INVALID_MOVE;

                G.territories[sourceId].armies -= 1;
                G.territories[targetId].armies += 1;
              }
            }
          }
        }
      }
    }
  },
  
  endIf: ({ G, ctx }) => {
    const playerId = ctx.currentPlayer;
    const objective = G.players[playerId]?.objective;
    if (!objective) return null;
    
    let conditionMet = false;
    
    if (objective.type === 'continent') {
      const continent = G.continents[objective.continent];
      if (continent) {
        conditionMet = continent.territories.every(tId => G.territories[tId]?.owner === playerId);
      }
    } 
    else if (objective.type === 'destroy') {
      const targetPlayer = G.players[objective.target];
      if (targetPlayer?.eliminated) {
         conditionMet = true; 
      }
    }
    else if (objective.type === 'territories') {
      const ownedCount = Object.values(G.territories).filter(t => t.owner === playerId).length;
      if (ownedCount >= objective.count) {
        conditionMet = true;
      }
    }
    
    if (conditionMet) {
      return { winner: playerId };
    }
    return null;
  }
};