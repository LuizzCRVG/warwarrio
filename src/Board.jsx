// src/Board.jsx
import React, { useState, useEffect } from 'react';
import { territoryNames } from './Game'; 

export function WarBoard({ G, ctx, moves, events }) {
  const currentPlayer = G.players[ctx.currentPlayer];
  const [selectedTerritory, setSelectedTerritory] = useState(null);
  const [targetTerritory, setTargetTerritory] = useState(null); 
  const [selectedCards, setSelectedCards] = useState([]);
  
  const [isObjectiveVisible, setIsObjectiveVisible] = useState(false);
  const [isCardsVisible, setIsCardsVisible] = useState(false);
  
  // NOVO: Controle do Mapa Fantasma para ajudar no encaixe
  const [showGhostMap, setShowGhostMap] = useState(true);

  useEffect(() => {
    setIsObjectiveVisible(false);
    setIsCardsVisible(false);
    setSelectedTerritory(null);
    setTargetTerritory(null);
    setSelectedCards([]);
  }, [ctx.currentPlayer]);

  const getObjectiveDesc = (obj) => {
    if (!obj) return 'A sortear missão...';
    if (obj.type === 'continent') return `Conquistar o continente ${G.continents[obj.continent].name}.`;
    if (obj.type === 'destroy') return `Destruir totalmente as forças do ${G.players[obj.target].faction}.`;
    if (obj.type === 'territories') return `MUTAÇÃO TÁTICA: Conquistar ${obj.count} territórios quaisquer.`;
    return 'Objetivo desconhecido.';
  };
  
  const currentStage = ctx.activePlayers?.[ctx.currentPlayer] || 'reinforcement';
  const stageNames = { reinforcement: "Recebimento de Tropas", attack: "Fase de Ataque", maneuver: "Remanejamento" };

  const getReachableTerritories = (sourceId) => {
    if (!sourceId || G.territories[sourceId].owner !== ctx.currentPlayer) return [];
    const visited = new Set();
    const queue = [sourceId];
    visited.add(sourceId);
    while (queue.length > 0) {
      const current = queue.shift();
      const neighbors = G.connections[current] || [];
      for (const neighbor of neighbors) {
        if (G.territories[neighbor].owner === ctx.currentPlayer && !visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }
    return Array.from(visited);
  };

  const reachableNetwork = (currentStage === 'maneuver' && selectedTerritory) 
    ? getReachableTerritories(selectedTerritory) 
    : [];

  const handleTerritoryClick = (id) => {
    if (currentPlayer.eliminated) return;
    if (G.pendingOccupation) {
      alert("Resolva a ocupação do território conquistado primeiro!");
      return;
    }

    if (currentStage === 'reinforcement') {
      moves.placeArmy(id);
    } 
    else if (currentStage === 'attack' || currentStage === 'maneuver') {
      if (!selectedTerritory) {
        if (G.territories[id].owner !== ctx.currentPlayer) {
          alert("Selecione um território SEU para iniciar a ação."); return;
        }
        setSelectedTerritory(id);
      } 
      else if (selectedTerritory === id) {
        setSelectedTerritory(null);
        setTargetTerritory(null);
      }
      else {
        if (currentStage === 'maneuver') {
          moves.moveArmy(selectedTerritory, id);
          setSelectedTerritory(null);
        } 
        else if (currentStage === 'attack') {
          setTargetTerritory(id);
        }
      }
    }
  };

  const executeAttack = (type) => {
    if (type === 'CLASSIC') moves.declareAttack(selectedTerritory, targetTerritory);
    if (type === 'BLITZ') moves.blitzAttack(selectedTerritory, targetTerritory);
    setSelectedTerritory(null);
    setTargetTerritory(null);
  };

  const handleCardClick = (index) => {
    if (currentStage !== 'reinforcement') return; 
    if (selectedCards.includes(index)) setSelectedCards(selectedCards.filter(i => i !== index));
    else if (selectedCards.length < 3) setSelectedCards([...selectedCards, index]);
  };

  const handleNextStep = () => {
    if (G.pendingOccupation) return alert("Conclua a ocupação antes de encerrar o ataque!");
    if (currentStage === 'reinforcement' && G.troopsToPlace > 0) return alert(`Posicione as ${G.troopsToPlace} tropas!`);
    if (currentStage === 'reinforcement' && currentPlayer.cards.length >= 5) return alert("Troca Obrigatória Exigida!");

    setSelectedTerritory(null); setTargetTerritory(null); setSelectedCards([]);
    
    if (ctx.phase === 'initialReinforcement') {
      events.endTurn();
      return;
    }

    if (currentStage === 'reinforcement') events.setStage('attack');
    else if (currentStage === 'attack') events.setStage('maneuver');
    else if (currentStage === 'maneuver') events.endTurn();
  };

  const isNextButtonDisabled = 
    (currentStage === 'reinforcement' && G.troopsToPlace > 0) || 
    (currentStage === 'reinforcement' && currentPlayer.cards.length >= 5) ||
    (G.pendingOccupation !== null); 

  const shapeIcons = { 'Triângulo': '▲', 'Quadrado': '■', 'Círculo': '●', 'Coringa': '★' };

// ============================================================================
  // DICIONÁRIO CARTOGRÁFICO - ENCAIXE COMPACTO (TETRIS/QUEBRA-CABEÇA)
  // Sem mapa de fundo. Os territórios se tocam diretamente, exceto nas baías.
  // ============================================================================
  const mapConfig = {
    // ==== BAIXADA FLUMINENSE (Topo Esquerdo - Conectados) ====
    'N29_Japeri': { img: 'mapa29.png', top: '50px', left: '50px', width: '100px', height: '100px' },
    'N28_Queimados': { img: 'mapa28.png', top: '50px', left: '150px', width: '100px', height: '100px' },
    'N27_NovaIguacu': { img: 'mapa27.png', top: '150px', left: '150px', width: '120px', height: '120px' },
    'N26_BelfordRoxo': { img: 'mapa26.png', top: '50px', left: '250px', width: '100px', height: '100px' },
    'N25_Mesquita': { img: 'mapa25.png', top: '150px', left: '270px', width: '100px', height: '100px' },
    'N24_Nilopolis': { img: 'mapa24.png', top: '150px', left: '370px', width: '80px', height: '80px' },
    'N23_SaoJoaoMeriti': { img: 'mapa23.png', top: '50px', left: '350px', width: '100px', height: '100px' },
    'N22_DuqueCaxias': { img: 'mapa22.png', top: '50px', left: '450px', width: '120px', height: '120px' },
    'N30_Mage': { img: 'mapa30.png', top: '50px', left: '620px', width: '130px', height: '130px' }, // Gap p/ SG

    // ==== ZONA OESTE (Base Esquerda - Conectados) ====
    'N20_SantaCruz': { img: 'mapa19.png', top: '450px', left: '20px', width: '130px', height: '130px' },
    'N19_CampoGrande': { img: 'mapa18.png', top: '450px', left: '150px', width: '130px', height: '130px' },
    'N18_Bangu': { img: 'mapa17.png', top: '350px', left: '150px', width: '130px', height: '100px' },
    'N21_Guaratiba': { img: 'mapa20.png', top: '580px', left: '150px', width: '130px', height: '130px' },
    'N17_Jacarepagua': { img: 'mapa16.png', top: '450px', left: '280px', width: '130px', height: '130px' },
    'N16_BarraTijuca': { img: 'mapa15.png', top: '580px', left: '280px', width: '150px', height: '100px' },

    // ==== ZONA NORTE (Miolo - Conectados) ====
    'N14_Pavuna': { img: 'mapa14.png', top: '150px', left: '450px', width: '100px', height: '100px' },
    'N13_Madureira': { img: 'mapa13.png', top: '250px', left: '450px', width: '100px', height: '100px' },
    'N11_ComplexoAlemao': { img: 'mapa11.png', top: '150px', left: '550px', width: '100px', height: '100px' },
    'N12_GrandeMeier': { img: 'mapa12.png', top: '250px', left: '550px', width: '100px', height: '100px' },
    'N10_SaoCristovao': { img: 'mapa10.png', top: '250px', left: '650px', width: '100px', height: '100px' },
    'N09_GrandeTijuca': { img: 'mapa9.png', top: '350px', left: '550px', width: '100px', height: '100px' },
    'N15_IlhaGovernador': { img: 'mapa.png', top: '435px', left: '1050px', width: '160px', height: '140px' }, // Gap p/ todos

    // ==== CENTRO E ZONA SUL (Base Centro-Direita - Conectados) ====
    'N03_Saude': { img: 'mapa7.png', top: '350px', left: '650px', width: '90px', height: '90px' },
    'N01_Centro': { img: 'mapa6.png', top: '440px', left: '650px', width: '90px', height: '90px' },
    'N02_Lapa': { img: 'mapa5.png', top: '440px', left: '560px', width: '90px', height: '90px' },
    'N04_RioComprido': { img: 'mapa8.png', top: '350px', left: '500px', width: '80px', height: '80px' },
    'N05_GloriaBotafogo': { img: 'mapa4.png', top: '530px', left: '650px', width: '100px', height: '100px' },
    'N06_Copacabana': { img: 'mapa3.png', top: '630px', left: '650px', width: '100px', height: '100px' },
    'N07_IpanemaLeblon': { img: 'mapa1.png', top: '630px', left: '550px', width: '100px', height: '100px' },
    'N08_RocinhaGavea': { img: 'mapa2.png', top: '630px', left: '450px', width: '100px', height: '100px' },

    // ==== SÃO GONÇALO (O "Portão" do Leste) ====
    'N37_Neves': { img: 'mapa37.png', top: '200px', left: '980px', width: '90px', height: '90px' },
    'N38_ZeGaroto': { img: 'mapa38.png', top: '200px', left: '1070px', width: '90px', height: '90px' },
    'N39_Mutua': { img: 'mapa39.png', top: '200px', left: '1160px', width: '90px', height: '90px' },
    'N40_Alcantara': { img: 'mapa40.png', top: '200px', left: '1250px', width: '90px', height: '90px' },
    'N41_JardimCatarina': { img: 'mapa41.png', top: '110px', left: '1160px', width: '90px', height: '90px' },
    'N42_Guaxindiba': { img: 'mapa42.png', top: '20px', left: '1070px', width: '110px', height: '110px' }, // A EXCEÇÃO: Perto da Baixada

    // ==== NITERÓI (Extremo Leste - "Bem a Direita") ====
    'N31_CentroNit': { img: 'mapa31.png', top: '500px', left: '1250px', width: '100px', height: '100px' },
    'N35_Fonseca': { img: 'mapa35.png', top: '400px', left: '1250px', width: '100px', height: '100px' },
    'N36_Engenhoca': { img: 'mapa36.png', top: '400px', left: '1350px', width: '100px', height: '100px' },
    'N32_Icarai': { img: 'mapa32.png', top: '600px', left: '1250px', width: '100px', height: '100px' },
    'N34_Pendotiba': { img: 'mapa34.png', top: '500px', left: '1350px', width: '100px', height: '100px' },
    'N33_RegiaoOceanica': { img: 'mapa33.png', top: '600px', left: '1350px', width: '120px', height: '120px' },
  };

  return ctx.gameover ? (
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.95)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', zIndex: 10000, fontFamily: 'monospace', textAlign: 'center', padding: '20px' }}>
        <h1 style={{ fontSize: '3em', color: G.players[ctx.gameover.winner].color }}>🏆 VITÓRIA! 🏆</h1>
        <h2 style={{ fontSize: '2em', margin: '20px 0' }}>{G.players[ctx.gameover.winner].faction} dominou a Metrópole!</h2>
        <p style={{ fontSize: '1.5em' }}>Missão cumprida: <span style={{color: '#ffdd55'}}>{getObjectiveDesc(G.players[ctx.gameover.winner].objective)}</span></p>
      </div>
    ) : (
      <div style={{ padding: '20px', backgroundColor: '#111', color: '#eaeaea', minHeight: '100vh', fontFamily: 'monospace' }}>
        
        {/* CABEÇALHO COM BOTÃO DO MODO DESENVOLVEDOR */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1 style={{ margin: 0 }}>WAR: Metrópole Fluminense</h1>
          <button 
            onClick={() => setShowGhostMap(!showGhostMap)}
            style={{ padding: '8px 15px', backgroundColor: showGhostMap ? '#ff4444' : '#444', color: 'white', border: '1px solid #666', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            {showGhostMap ? '🛠️ Ocultar Mapa Fantasma' : '🛠️ Ligar Mapa Fantasma'}
          </button>
        </div>

        {/* PAINEL TÁTICO SUPERIOR (Mantido igual) */}
        {currentPlayer.eliminated ? (
          <div style={{ backgroundColor: '#8b0000', padding: '40px', borderRadius: '8px', textAlign: 'center', marginBottom: '20px' }}>
            <h2>☠️ FACÇÃO ERRADICADA ☠️</h2>
            <button onClick={() => events.endTurn()} style={{ marginTop: '20px', padding: '15px 30px', cursor: 'pointer', border: 'none', fontWeight: 'bold' }}>Pular Turno</button>
          </div>
        ) : (
          <div style={{ marginBottom: '20px', padding: '15px', border: `2px solid ${currentPlayer.color}`, backgroundColor: '#1a1a1a', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px', borderRadius: '8px' }}>
            {/* ... Todo o seu painel de interface de cima fica aqui, não mudei nada nessa parte visual de cima! ... */}
            <div style={{ flex: '1', minWidth: '250px' }}>
              <p>Comandante: <strong style={{color: currentPlayer.color}}>{currentPlayer.faction}</strong> | Fase: <strong style={{color: '#ffdd55'}}>{ctx.phase === 'initialReinforcement' ? 'FORTALECIMENTO INICIAL' : stageNames[currentStage]}</strong></p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                <span style={{ margin: 0 }}>Missão Secreta:</span>
                <button onClick={() => setIsObjectiveVisible(!isObjectiveVisible)} style={{ padding: '2px 8px', backgroundColor: '#444', color: '#fff', border: '1px solid #666', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                  {isObjectiveVisible ? '🙈 Ocultar' : '👁️ Revelar'}
                </button>
              </div>
              <p style={{ marginTop: '5px' }}>
                <strong style={{ color: isObjectiveVisible ? '#ffaa00' : '#888', backgroundColor: isObjectiveVisible ? 'transparent' : '#2a2a2a', padding: isObjectiveVisible ? '0' : '2px 10px', borderRadius: '4px', letterSpacing: isObjectiveVisible ? 'normal' : '2px' }}>
                  {isObjectiveVisible ? getObjectiveDesc(currentPlayer.objective) : '•••••••••••••••• (Oculto)'}
                </strong>
              </p>
              {currentStage === 'reinforcement' && <p>Reforços: <strong>🪖 {G.troopsToPlace}</strong></p>}
              {selectedTerritory && !G.pendingOccupation && <p>Origem: <span style={{color: '#5bc0de'}}>{territoryNames[selectedTerritory]}</span></p>}
            </div>

            {/* Inventário */}
            <div style={{ backgroundColor: '#2a2a2a', padding: '15px', borderRadius: '5px', minWidth: '200px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h3 style={{ margin: 0 }}>Inventário</h3>
                <button onClick={() => setIsCardsVisible(!isCardsVisible)} style={{ padding: '2px 8px', backgroundColor: '#444', color: '#fff', border: '1px solid #666', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                  {isCardsVisible ? '🙈 Ocultar' : '👁️ Revelar'}
                </button>
              </div>
              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '10px', filter: isCardsVisible ? 'none' : 'blur(6px)', pointerEvents: isCardsVisible ? 'auto' : 'none', transition: 'filter 0.3s ease' }}>
                {currentPlayer.cards.length === 0 && <span style={{color: '#666', fontSize: '12px'}}>Sem cartas.</span>}
                {currentPlayer.cards.map((card, idx) => (
                  <div key={idx} onClick={() => handleCardClick(idx)} style={{ border: selectedCards.includes(idx) ? '2px solid #5bc0de' : '1px solid #888', borderRadius: '5px', padding: '8px', cursor: 'pointer', textAlign: 'center' }}>
                    <div style={{ color: '#ffdd55', fontSize: '18px' }}>{shapeIcons[card.shape]}</div>
                  </div>
                ))}
              </div>
              {currentStage === 'reinforcement' && (
                <button onClick={() => { moves.exchangeCards(selectedCards); setSelectedCards([]); }} disabled={selectedCards.length !== 3} style={{ width: '100%', padding: '5px', cursor: selectedCards.length === 3 ? 'pointer' : 'not-allowed' }}>Trocar</button>
              )}
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(selectedTerritory || targetTerritory) && !G.pendingOccupation && (
                 <button onClick={() => { setSelectedTerritory(null); setTargetTerritory(null); }} style={{ padding: '10px 20px', cursor: 'pointer', backgroundColor: '#555', color: 'white', border: 'none' }}>Cancelar</button>
              )}
              <button onClick={handleNextStep} disabled={isNextButtonDisabled} style={{ padding: '10px 20px', cursor: isNextButtonDisabled ? 'not-allowed' : 'pointer', backgroundColor: currentStage === 'maneuver' || ctx.phase === 'initialReinforcement' ? '#d9534f' : '#5bc0de', color: 'white', border: 'none', fontWeight: 'bold' }}>
                {ctx.phase === 'initialReinforcement' ? 'Encerrar Fortalecimento' : currentStage === 'maneuver' ? 'Encerrar Turno' : 'Avançar Fase ➔'}
              </button>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* A GRANDE MESA DO TABULEIRO (POSICIONAMENTO ABSOLUTO)              */}
        {/* ================================================================= */}
        
        <div style={{
            position: 'relative',
            width: '1600px', // Aumente aqui se São Gonçalo estiver vazando da tela!
            height: '900px',
            margin: '0 auto', // Centraliza na tela
            backgroundColor: showGhostMap ? 'transparent' : '#1a1a1a', // Fundo escuro se o fantasma tiver desligado
            backgroundImage: showGhostMap ? 'url(/mapa_fantasma.png)' : 'none',
            backgroundSize: '100% 100%',
            backgroundRepeat: 'no-repeat',
            border: '4px solid #444',
            borderRadius: '12px',
            overflow: 'hidden' // Evita que imagens vazem da mesa
        }}>

          {Object.keys(G.territories).map(id => {
            const data = G.territories[id];
            const ownerData = G.players[data.owner];
            const isSelected = selectedTerritory === id;
            const isTarget = targetTerritory === id;
            
            let isHighlight = false;
            let highlightColor = '';
            
            if (currentStage === 'attack' && selectedTerritory) {
                isHighlight = G.connections[selectedTerritory]?.includes(id) && ownerData.faction !== currentPlayer.faction;
                highlightColor = '#ffdd55'; 
            } else if (currentStage === 'maneuver' && selectedTerritory) {
                isHighlight = reachableNetwork.includes(id) && id !== selectedTerritory;
                highlightColor = '#5bc0de'; 
            }

            const isDimmed = selectedTerritory && !isSelected && !isHighlight && !isTarget;
            const borderColor = isTarget ? '#ff4444' : isSelected ? '#ffffff' : (isHighlight ? highlightColor : ownerData.color);
            const bgColor = isSelected ? '#444' : isTarget ? '#522' : '#2a2a2a';
            
            // Puxa as coordenadas, a imagem e as DIMENSÕES do nosso dicionário
            const config = mapConfig[id] || { img: 'fallback.png', top: '0px', left: '0px', width: '220px', height: '130px' };
            const customMask = config.img;

            return (
              <div key={id} onClick={() => handleTerritoryClick(id)}
                style={{
                  position: 'absolute', 
                  top: config.top,      
                  left: config.left,    
                  width: config.width,       // AGORA PUXA DO DICIONÁRIO!
                  height: config.height,     // AGORA PUXA DO DICIONÁRIO!
                  cursor: isDimmed ? 'not-allowed' : 'pointer', 
                  opacity: isDimmed ? 0.3 : (showGhostMap ? 0.8 : 1), 
                  transition: 'all 0.3s ease-in-out', 
                  transform: (isSelected || isTarget) ? 'scale(1.1)' : 'scale(1)',
                  zIndex: (isSelected || isTarget || isHighlight) ? 100 : 10, 
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  filter: `
                    drop-shadow(3px 0px 0px ${borderColor}) drop-shadow(-3px 0px 0px ${borderColor})
                    drop-shadow(0px 3px 0px ${borderColor}) drop-shadow(0px -3px 0px ${borderColor})
                    ${isHighlight ? `drop-shadow(0 0 15px ${highlightColor})` : ''}
                  `
                }}
              >
                {/* Se a imagem ainda não existir, o CSS falha silenciosamente, não quebra o jogo */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                  backgroundColor: bgColor,
                  WebkitMaskImage: `url(/${customMask})`, maskImage: `url(/${customMask})`,
                  WebkitMaskSize: 'contain', maskSize: 'contain',
                  WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat',
                  WebkitMaskPosition: 'center', maskPosition: 'center', zIndex: -1 
                }} />
                
                <h3 style={{ fontSize: '11px', margin: '15px 0 2px 0', textTransform: 'uppercase', textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                  {territoryNames[id]}
                </h3>
                <p style={{ fontSize: '16px', margin: '0', textShadow: '2px 2px 4px rgba(0,0,0,0.8)', fontWeight: 'bold' }}>
                  🪖 {data.armies}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    );
}