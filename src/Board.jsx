// src/Board.jsx
import React, { useState, useEffect } from 'react';
import { territoryNames } from './Game'; 

// ============================================================================
// UTILITÁRIOS E CONFIGURAÇÕES DA ENGINE
// ============================================================================
const MAP_CONFIG_VERSION = '1.0';

const hexToRgba = (hex, alpha) => {
  let r = 0, g = 0, b = 0;
  if (!hex) return `rgba(0,0,0,${alpha})`;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex.substring(1, 3), 16);
    g = parseInt(hex.substring(3, 5), 16);
    b = parseInt(hex.substring(5, 7), 16);
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const imageMapping = {
  'N07_IpanemaLeblon': 'mapa1.png', 'N08_RocinhaGavea': 'mapa2.png', 'N06_Copacabana': 'mapa3.png',
  'N05_GloriaBotafogo': 'mapa4.png', 'N02_Lapa': 'mapa5.png', 'N01_Centro': 'mapa6.png',
  'N03_Saude': 'mapa7.png', 'N04_RioComprido': 'mapa8.png', 'N09_GrandeTijuca': 'mapa9.png',
  'N10_SaoCristovao': 'mapa10.png', 'N11_ComplexoAlemao': 'mapa11.png', 'N12_GrandeMeier': 'mapa12.png',
  'N13_Madureira': 'mapa13.png', 'N14_Pavuna': 'mapa14.png', 'N15_IlhaGovernador': 'mapa.png',
  'N16_BarraTijuca': 'mapa15.png', 'N17_Jacarepagua': 'mapa16.png', 'N18_Bangu': 'mapa17.png',
  'N19_CampoGrande': 'mapa18.png', 'N20_SantaCruz': 'mapa19.png', 'N21_Guaratiba': 'mapa20.png',
  'N24_Nilopolis': 'mapa21.png', 'N25_Mesquita': 'mapa22.png', 'N26_BelfordRoxo': 'mapa24.png',
  'N27_NovaIguacu': 'mapa26.png', 'N28_Queimados': 'mapa27.png', 'N29_Japeri': 'mapa29.png',
  'N23_SaoJoaoMeriti': 'mapa23.png', 'N22_DuqueCaxias': 'mapa25.png', 'N30_Mage': 'mapa28.png',
  'N31_CentroNit': 'mapa30.png', 'N35_Fonseca': 'mapa35.png', 'N36_Engenhoca': 'mapa35.png',
  'N32_Icarai': 'mapa31.png', 'N34_Pendotiba': 'mapa33.png', 'N33_RegiaoOceanica': 'mapa32.png',
  'N37_Neves': 'mapa37.png', 'N38_ZeGaroto': 'mapa38.png', 'N39_Mutua': 'mapa39.png',
  
  // Dê uma olhada se Catarina e Alcântara não precisam ter os números reduzidos também!
  'N40_Alcantara': 'mapa40.png', 
  'N41_JardimCatarina': 'mapa40.png', // Deixei como 40 provisoriamente para não clonar o 41
  'N42_Guaxindiba': 'mapa41.png'      // <-- GUAXINDIBA CORRIGIDA PARA 41!
};

const generateInitialConfig = () => {
  const config = {};
  let x = 20, y = 950; 
  Object.keys(territoryNames).forEach(id => {
    config[id] = { img: imageMapping[id] || 'mapa_generico.png', top: y, left: x, width: 100, height: 100 };
    x += 120;
    if (x > 1400) { x = 20; y += 120; }
  });
  return config;
};

const validateAndMigrateConfig = (savedConfig) => {
  const defaultConfig = generateInitialConfig();
  const validConfig = {};
  const validIds = Object.keys(territoryNames);

  validIds.forEach(id => {
    if (savedConfig[id] && typeof savedConfig[id] === 'object') {
      validConfig[id] = { ...defaultConfig[id], ...savedConfig[id] };
    } else {
      validConfig[id] = defaultConfig[id];
    }
  });
  return validConfig;
};

// Adicionado onRestart nas props extraídas pelo Boardgame.io
export function WarBoard({ G, ctx, moves, events, onRestart }) {
  const currentPlayer = G.players[ctx.currentPlayer];
  const [selectedTerritory, setSelectedTerritory] = useState(null);
  const [targetTerritory, setTargetTerritory] = useState(null); 
  const [selectedCards, setSelectedCards] = useState([]);
  
  const [isObjectiveVisible, setIsObjectiveVisible] = useState(false);
  const [isCardsVisible, setIsCardsVisible] = useState(false);
  const [isLogVisible, setIsLogVisible] = useState(false);
  const [occupationExtra, setOccupationExtra] = useState(0);

  // ============================================================================
  // MODO CONSTRUTOR (LEVEL EDITOR)
  // ============================================================================
  const [isBuilderMode, setIsBuilderMode] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [dragInfo, setDragInfo] = useState(null);
  
  const [mapConfig, setMapConfig] = useState(() => {
    const saved = localStorage.getItem('warMapConfig');
    if (!saved) return generateInitialConfig();
    try {
      const parsed = JSON.parse(saved);
      if (parsed.version !== MAP_CONFIG_VERSION || !parsed.config) {
        return generateInitialConfig();
      }
      return validateAndMigrateConfig(parsed.config);
    } catch (e) {
      return generateInitialConfig();
    }
  });

  useEffect(() => {
    if (!dragInfo) {
      localStorage.setItem('warMapConfig', JSON.stringify({
        version: MAP_CONFIG_VERSION,
        config: mapConfig
      }));
    }
  }, [dragInfo, mapConfig]);

  // ============================================================================
  // CÂMERA E ZOOM (MAP SCALE)
  // ============================================================================
  const currentMapHeight = isBuilderMode ? 1600 : 900;
  
  const [mapScale, setMapScale] = useState(() => {
    if (typeof window !== 'undefined') {
      return Math.min(window.innerWidth / 1600, window.innerHeight / 900) * 0.95;
    }
    return 1;
  });

  useEffect(() => {
    const handleResize = () => {
      const heightToUse = isBuilderMode ? 1600 : 900;
      setMapScale(Math.min(window.innerWidth / 1600, window.innerHeight / heightToUse) * 0.95);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isBuilderMode]);

  const handleZoomIn = () => setMapScale(prev => Math.min(1.5, prev + 0.1));
  const handleZoomOut = () => setMapScale(prev => Math.max(0.3, prev - 0.1));

  // ============================================================================
  // LÓGICA DE DRAG & DROP DO CONSTRUTOR
  // ============================================================================
  useEffect(() => {
    const handlePointerMove = (e) => {
      if (!dragInfo) return;
      e.preventDefault();
      
      const dx = (e.pageX - dragInfo.startX) / mapScale;
      const dy = (e.pageY - dragInfo.startY) / mapScale;

      setMapConfig(prev => {
        const updated = { ...prev };
        const t = updated[editTarget];
        if (!t) return prev;

        let newLeft = dragInfo.initialLeft;
        let newTop = dragInfo.initialTop;
        let newWidth = dragInfo.initialWidth;
        let newHeight = dragInfo.initialHeight;

        if (dragInfo.action === 'drag') {
          newLeft += dx; newTop += dy;
        } else if (dragInfo.action === 'resize-se') {
          newWidth = Math.max(30, newWidth + dx); 
          newHeight = Math.max(30, newHeight + dy); 
        }

        updated[editTarget] = { ...t, left: newLeft, top: newTop, width: newWidth, height: newHeight };
        return updated;
      });
    };

    const handlePointerUp = () => { if (dragInfo) setDragInfo(null); };

    if (dragInfo) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    }
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [dragInfo, editTarget, mapScale]);

  const startDrag = (e, id, action) => {
    if (!isBuilderMode) return;
    e.stopPropagation();
    setEditTarget(id);
    const t = mapConfig[id];
    setDragInfo({ action, startX: e.pageX, startY: e.pageY, initialLeft: t.left, initialTop: t.top, initialWidth: t.width, initialHeight: t.height });
  };

  const copyConfigToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(mapConfig, null, 2));
    alert("Estrutura do Mapa copiada para a área de transferência!");
  };

  const placedCount = Object.values(mapConfig).filter(t => parseInt(t.top, 10) < 900).length;
  const trayCount = Object.keys(mapConfig).length - placedCount;

  // ============================================================================
  // LÓGICA PADRÃO DO JOGO
  // ============================================================================
  useEffect(() => {
    if (!isBuilderMode) {
      setIsObjectiveVisible(false);
      setIsCardsVisible(false);
      setIsLogVisible(false);
      setSelectedTerritory(null);
      setTargetTerritory(null);
      setSelectedCards([]);
    }
  }, [ctx.currentPlayer, isBuilderMode]);

  useEffect(() => {
    if (G.pendingOccupation) setOccupationExtra(0);
  }, [G.pendingOccupation]);

  const getObjectiveDesc = (obj) => {
    if (!obj) return 'A sortear missão...';
    if (obj.type === 'continent') return `Conquistar o continente ${G.continents[obj.continent].name}.`;
    if (obj.type === 'destroy') return `Destruir totalmente as forças do ${G.players[obj.target].faction}.`;
    if (obj.type === 'territories') return `MUTAÇÃO TÁTICA: Conquistar ${obj.count} territórios quaisquer.`;
    return 'Objetivo desconhecido.';
  };
  
  const currentStage = ctx.activePlayers?.[ctx.currentPlayer] || 'reinforcement';

  const getStageColor = (stage) => {
    if (ctx.phase === 'initialReinforcement' || stage === 'reinforcement') return '#5bc0de'; 
    if (stage === 'attack') return '#ff4444'; 
    if (stage === 'maneuver') return '#55cc55'; 
    return '#fff';
  };

  const getStageName = (stage) => {
    if (ctx.phase === 'initialReinforcement') return 'Fortalecimento Inicial';
    if (stage === 'reinforcement') return 'Recebimento de Tropas';
    if (stage === 'attack') return 'Fase de Ataque';
    if (stage === 'maneuver') return 'Remanejamento';
    return '';
  };

  const getStageContextText = () => {
    if (currentStage === 'reinforcement') {
      if (G.troopsToPlace > 0) return <span>Tropas: <strong style={{color: '#ffdd55', fontSize: '15px'}}>{G.troopsToPlace}</strong></span>;
      return <span style={{color: '#888'}}>Nenhuma tropa restante</span>;
    }
    if (currentStage === 'attack') {
      if (selectedTerritory) return <span>Atacando de: <strong style={{color: '#5bc0de'}}>{territoryNames[selectedTerritory]}</strong></span>;
      return <span style={{color: '#888'}}>Selecione uma base para atacar</span>;
    }
    if (currentStage === 'maneuver') {
      if (selectedTerritory) return <span>Movendo de: <strong style={{color: '#5bc0de'}}>{territoryNames[selectedTerritory]}</strong></span>;
      return <span style={{color: '#888'}}>Selecione uma base para mover</span>;
    }
    return '';
  };

  const getNextButtonText = () => {
    if (ctx.phase === 'initialReinforcement') return 'Passar Turno ▶';
    if (currentStage === 'reinforcement') return 'Ir para Ataque ▶';
    if (currentStage === 'attack') return 'Ir para Remanejamento ▶';
    if (currentStage === 'maneuver') return 'Encerrar Turno ▶';
    return 'Avançar ▶';
  };

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
          visited.add(neighbor); queue.push(neighbor);
        }
      }
    }
    return Array.from(visited);
  };

  const reachableNetwork = (currentStage === 'maneuver' && selectedTerritory) ? getReachableTerritories(selectedTerritory) : [];

  const handleTerritoryClick = (id) => {
    if (isBuilderMode) { setEditTarget(id); return; }
    if (currentPlayer.eliminated) return;
    if (G.pendingOccupation) return;

    if (currentStage === 'reinforcement') {
      moves.placeArmy(id);
    } else if (currentStage === 'attack' || currentStage === 'maneuver') {
      if (!selectedTerritory) {
        if (G.territories[id].owner !== ctx.currentPlayer) { alert("Selecione um território SEU."); return; }
        setSelectedTerritory(id);
      } else if (selectedTerritory === id) {
        setSelectedTerritory(null); setTargetTerritory(null);
      } else {
        if (currentStage === 'maneuver') { 
          moves.moveArmy(selectedTerritory, id); setSelectedTerritory(null); 
        } 
        else if (currentStage === 'attack') { 
          if (G.territories[id].owner !== ctx.currentPlayer && G.connections[selectedTerritory].includes(id)) {
            setTargetTerritory(id);
          } else {
            alert("Alvo inválido! Selecione um território inimigo que faça fronteira.");
          }
        }
      }
    }
  };

  const handleNextStep = () => {
    if (G.pendingOccupation) return alert("Conclua a ocupação!");
    if (currentStage === 'reinforcement' && G.troopsToPlace > 0) return alert(`Posicione as ${G.troopsToPlace} tropas!`);
    if (currentStage === 'reinforcement' && currentPlayer.cards.length >= 5) return alert("Troca Obrigatória!");

    setSelectedTerritory(null); setTargetTerritory(null); setSelectedCards([]);
    if (ctx.phase === 'initialReinforcement') { events.endTurn(); return; }
    if (currentStage === 'reinforcement') events.setStage('attack');
    else if (currentStage === 'attack') events.setStage('maneuver');
    else if (currentStage === 'maneuver') events.endTurn();
  };

  const isNextButtonDisabled = (currentStage === 'reinforcement' && G.troopsToPlace > 0) || (currentStage === 'reinforcement' && currentPlayer.cards.length >= 5) || (G.pendingOccupation !== null); 
  const shapeIcons = { 'Triângulo': '▲', 'Quadrado': '■', 'Círculo': '●', 'Coringa': '★' };

  // ============================================================================
  // SISTEMA DE CARTAS E LOGÍSTICA
  // ============================================================================
  const numCards = currentPlayer.cards.length;
  const isMandatoryTrade = numCards >= 5;

  const handleCardClick = (index) => {
    if (currentStage !== 'reinforcement') return; 
    if (selectedCards.includes(index)) setSelectedCards(selectedCards.filter(i => i !== index));
    else if (selectedCards.length < 3) setSelectedCards([...selectedCards, index]);
  };

  const getTradeValue = (count) => {
    const tradeValues = [4, 6, 8, 10, 12, 15];
    if (count < 6) return tradeValues[count];
    return 15 + ((count - 5) * 5);
  };
  const nextTradeValue = getTradeValue(G.tradeCount);

  const isValidTrade = (indices) => {
    if (indices.length !== 3) return false;
    const shapes = indices.map(i => currentPlayer.cards[i].shape);
    if (shapes.includes('Coringa')) return true;
    const uniqueShapes = new Set(shapes).size;
    return uniqueShapes === 1 || uniqueShapes === 3;
  };

  const currentSelectionValid = selectedCards.length === 3 ? isValidTrade(selectedCards) : null;

  // ============================================================================
  // TELA DE VITÓRIA (GAME OVER)
  // ============================================================================
  if (ctx.gameover) {
    const winnerId = ctx.gameover.winner;
    const winnerData = G.players[winnerId];

    return (
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(17, 17, 17, 0.95)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#eaeaea', zIndex: 10000, fontFamily: 'monospace' }}>
        
        {/* HEADER DA VITÓRIA */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <p style={{ letterSpacing: '4px', margin: '0 0 10px 0', color: '#888', fontSize: '14px' }}>
            OPERAÇÃO ENCERRADA
          </p>
          <h1 style={{ fontSize: '3rem', margin: '0 0 10px 0', color: winnerData.color, textTransform: 'uppercase', textShadow: `0 0 20px ${winnerData.color}` }}>
            {winnerData.faction}
          </h1>
          <h2 style={{ fontSize: '1.5rem', margin: 0, color: '#ccc', fontWeight: 'normal' }}>
            dominou a Metrópole Fluminense
          </h2>
        </div>

        {/* ESTATÍSTICAS DA PARTIDA */}
        <div style={{ width: '600px', backgroundColor: '#222', padding: '30px', borderRadius: '12px', border: '1px solid #444', boxShadow: '0 10px 30px rgba(0,0,0,0.8)' }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#fff', fontSize: '18px', borderBottom: '1px solid #444', paddingBottom: '10px' }}>
            Estatísticas da Partida
          </h3>
          
          {Object.keys(G.players).map(id => {
            const player = G.players[id];
            const territoryCount = Object.values(G.territories).filter(t => t.owner === id).length;
            const percentage = (territoryCount / 42) * 100;
            const isWinner = id === winnerId;

            return (
              <div key={id} style={{ marginBottom: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', alignItems: 'flex-end' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: player.color, fontWeight: 'bold', fontSize: '16px' }}>{player.faction}</span>
                    {isWinner && (
                      <span style={{ backgroundColor: '#ffdd55', color: 'black', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', letterSpacing: '1px' }}>
                        VENCEDOR
                      </span>
                    )}
                  </div>
                  <span style={{ color: '#aaa', fontSize: '14px' }}>{territoryCount} / 42 territórios</span>
                </div>
                <div style={{ width: '100%', height: '12px', backgroundColor: '#111', borderRadius: '6px', overflow: 'hidden' }}>
                  <div style={{ width: `${percentage}%`, height: '100%', backgroundColor: player.color, transition: 'width 1s ease-in-out' }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* BOTÃO DE REINÍCIO (Reseta o Boardgame.io via wrapper no App.jsx) */}
        <button 
          onClick={onRestart} 
          style={{ marginTop: '40px', padding: '15px 40px', fontSize: '18px', backgroundColor: '#5bc0de', color: 'black', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', textTransform: 'uppercase', boxShadow: '0 4px 15px rgba(91, 192, 222, 0.4)' }}
        >
          Nova Operação
        </button>

      </div>
    );
  }

  // ============================================================================
  // RENDERIZAÇÃO NORMAL (DURANTE A PARTIDA)
  // ============================================================================
  return (
    <div style={{ backgroundColor: '#111', color: '#eaeaea', minHeight: '100vh', fontFamily: 'monospace', display: 'flex', flexDirection: 'column' }}>
      
      {/* MODAIS GLOBAIS E PAINÉIS FLUTUANTES (Ocultos/Visíveis) */}
      {isObjectiveVisible && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9600, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ backgroundColor: '#222', border: `3px solid ${currentPlayer.color}`, padding: '30px', borderRadius: '10px', width: '400px', color: '#eaeaea', textAlign: 'center', boxShadow: '0 0 30px rgba(0,0,0,0.8)' }}>
            <h2 style={{ color: '#ffdd55', margin: '0 0 15px 0', fontSize: '24px' }}>🕵️ MISSÃO SECRETA</h2>
            <p style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 20px 0', padding: '20px', backgroundColor: '#111', borderRadius: '5px', border: '1px solid #444', lineHeight: '1.4' }}>
              {getObjectiveDesc(currentPlayer.objective)}
            </p>
            <p style={{ fontSize: '12px', color: '#ff4444', marginBottom: '25px', padding: '0 10px' }}>
              ⚠️ Esta informação é estritamente confidencial. Certifique-se de que outros jogadores não estejam olhando sua tela.
            </p>
            <button onClick={() => setIsObjectiveVisible(false)} style={{ width: '100%', padding: '12px', backgroundColor: '#444', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '5px', fontWeight: 'bold', fontSize: '16px' }}>
              Ocultar Missão
            </button>
          </div>
        </div>
      )}

      {isLogVisible && (
        <div style={{ position: 'fixed', bottom: '30px', right: '30px', width: '380px', backgroundColor: '#222', border: '1px solid #555', borderRadius: '8px', zIndex: 9000, display: 'flex', flexDirection: 'column', boxShadow: '0 0 20px rgba(0,0,0,0.8)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 15px', borderBottom: '1px solid #444', backgroundColor: '#1a1a1a', borderTopLeftRadius: '8px', borderTopRightRadius: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', color: '#eaeaea' }}>📜 Diário de Guerra</h3>
            <button onClick={() => setIsLogVisible(false)} style={{ background: 'transparent', border: 'none', color: '#eaeaea', cursor: 'pointer', fontSize: '16px' }}>✖</button>
          </div>
          <div style={{ padding: '15px', maxHeight: '350px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {G.log && G.log.length > 0 ? (
              [...G.log].reverse().slice(0, 20).map((entry, idx) => (
                <div key={idx} style={{ fontSize: '13px', lineHeight: '1.4', borderBottom: '1px dashed #333', paddingBottom: '8px' }}>
                  [<strong style={{ color: entry.color }}>{entry.faction}</strong>] {entry.msg}
                </div>
              ))
            ) : (
              <div style={{ fontSize: '13px', color: '#888', textAlign: 'center' }}>Nenhum evento registrado ainda.</div>
            )}
          </div>
        </div>
      )}

      {isCardsVisible && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9500, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ backgroundColor: '#222', border: `3px solid ${currentPlayer.color}`, padding: '30px', borderRadius: '10px', width: '600px', color: '#eaeaea', boxShadow: '0 0 30px rgba(0,0,0,0.8)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #444', paddingBottom: '10px' }}>
              <h2 style={{ margin: 0, color: '#ffdd55', fontSize: '24px' }}>🗃️ Cartas em Mão</h2>
              <button onClick={() => setIsCardsVisible(false)} style={{ padding: '5px 10px', backgroundColor: '#444', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '5px' }}>Fechar</button>
            </div>

            {numCards === 0 ? (
              <p style={{ textAlign: 'center', color: '#888', padding: '40px 0' }}>Seu exército não possui cartas estratégicas no momento.</p>
            ) : (
              <>
                <p style={{ fontSize: '14px', color: '#ccc', marginBottom: '20px' }}>
                  Selecione 3 cartas para trocar por tropas. Combinações válidas: 3 símbolos iguais, 3 diferentes, ou qualquer dupla + Coringa.
                </p>

                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '20px' }}>
                  {currentPlayer.cards.map((card, idx) => {
                    const isSelected = selectedCards.includes(idx);
                    const isCoringa = card.id.includes('Coringa');
                    const isOwned = !isCoringa && G.territories[card.id]?.owner === ctx.currentPlayer;
                    
                    return (
                      <div key={idx} onClick={() => handleCardClick(idx)} 
                        style={{ 
                          border: isSelected ? '3px solid #5bc0de' : '1px solid #666', 
                          borderRadius: '8px', padding: '15px 10px', cursor: currentStage === 'reinforcement' ? 'pointer' : 'not-allowed', 
                          textAlign: 'center', width: '120px', backgroundColor: isSelected ? '#333' : '#1a1a1a',
                          position: 'relative', transition: 'all 0.2s'
                        }}
                      >
                        <div style={{ color: '#ffdd55', fontSize: '32px', marginBottom: '10px' }}>{shapeIcons[card.shape]}</div>
                        <div style={{ fontSize: '12px', fontWeight: 'bold', wordWrap: 'break-word', lineHeight: '1.2' }}>{isCoringa ? 'CORINGA' : territoryNames[card.id]}</div>
                        {isOwned && (<div style={{ marginTop: '10px', fontSize: '11px', color: '#5bc0de', fontWeight: 'bold', backgroundColor: '#111', padding: '3px', borderRadius: '4px' }}>⭐ +2 Tropas aqui</div>)}
                      </div>
                    );
                  })}
                </div>

                <div style={{ backgroundColor: '#111', padding: '15px', borderRadius: '8px', border: '1px solid #444', textAlign: 'center' }}>
                  <p style={{ margin: '0 0 15px 0', fontSize: '16px' }}>Próxima troca global rende: <strong style={{ color: '#5bc0de', fontSize: '20px' }}>+{nextTradeValue} 🪖</strong></p>
                  {selectedCards.length === 3 && (
                    <p style={{ margin: '0 0 15px 0', fontWeight: 'bold', color: currentSelectionValid ? '#5bc0de' : '#ff4444' }}>{currentSelectionValid ? '✓ Combinação Válida!' : '❌ Combinação Inválida!'}</p>
                  )}
                  <button disabled={!currentSelectionValid || currentStage !== 'reinforcement'} onClick={() => { moves.exchangeCards(selectedCards); setSelectedCards([]); setIsCardsVisible(false); }} 
                    style={{ width: '100%', padding: '15px', fontSize: '16px', fontWeight: 'bold', borderRadius: '5px', border: 'none', backgroundColor: currentSelectionValid ? '#5bc0de' : '#444', color: currentSelectionValid ? 'black' : '#888', cursor: currentSelectionValid ? 'pointer' : 'not-allowed' }}>
                    Realizar Troca de Cartas
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {G.pendingOccupation && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ backgroundColor: '#222', border: `3px solid ${currentPlayer.color}`, padding: '30px', borderRadius: '10px', textAlign: 'center', minWidth: '400px', color: '#eaeaea', boxShadow: '0 0 30px rgba(0,0,0,0.8)' }}>
            <h2 style={{ color: '#ffdd55', marginTop: 0, fontSize: '28px' }}>🚩 Ocupação Bem-Sucedida!</h2>
            <p style={{ fontSize: '16px' }}>A base <strong>{territoryNames[G.pendingOccupation.targetId]}</strong> foi tomada.</p>
            <p style={{ fontSize: '14px', marginBottom: '25px' }}>Quantos batalhões extras de <strong>{territoryNames[G.pendingOccupation.sourceId]}</strong> você deseja deslocar para a nova fronteira?</p>

            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', margin: '30px 0' }}>
              <button onClick={() => setOccupationExtra(Math.max(0, occupationExtra - 1))} style={{ width: '50px', height: '50px', fontSize: '24px', backgroundColor: '#444', color: 'white', border: '1px solid #666', cursor: 'pointer', borderRadius: '8px' }}>-</button>
              <span style={{ fontSize: '40px', fontWeight: 'bold', width: '60px' }}>{occupationExtra}</span>
              <button onClick={() => setOccupationExtra(Math.min(G.pendingOccupation.maxExtra, occupationExtra + 1))} style={{ width: '50px', height: '50px', fontSize: '24px', backgroundColor: '#444', color: 'white', border: '1px solid #666', cursor: 'pointer', borderRadius: '8px' }}>+</button>
            </div>
            <p style={{ fontSize: '12px', color: '#888', marginBottom: '30px' }}>(Máximo permitido: {G.pendingOccupation.maxExtra})</p>

            <button onClick={() => { moves.occupy(occupationExtra); setOccupationExtra(0); setSelectedTerritory(null); setTargetTerritory(null); }} style={{ width: '100%', padding: '15px', backgroundColor: '#5bc0de', color: 'black', border: 'none', fontWeight: 'bold', fontSize: '18px', cursor: 'pointer', borderRadius: '5px' }}>
              ✓ Confirmar Deslocamento
            </button>
          </div>
        </div>
      )}

      {!G.pendingOccupation && targetTerritory && currentStage === 'attack' && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 8888, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ backgroundColor: '#222', border: `3px solid ${currentPlayer.color}`, padding: '30px', borderRadius: '10px', textAlign: 'center', minWidth: '450px', color: '#eaeaea', boxShadow: '0 0 30px rgba(0,0,0,0.8)' }}>
            <h2 style={{ marginTop: 0, color: '#ff4444', fontSize: '28px', letterSpacing: '2px' }}>⚔️ SALA DE GUERRA</h2>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#111', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #444' }}>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#888' }}>ORIGEM</h3>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>{territoryNames[selectedTerritory]}</h4>
                <span style={{ fontSize: '28px', color: '#5bc0de' }}>🪖 {G.territories[selectedTerritory].armies}</span>
              </div>
              <div style={{ padding: '0 20px', fontWeight: 'bold', color: '#ffdd55', fontSize: '20px' }}>VS</div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#888' }}>ALVO</h3>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>{territoryNames[targetTerritory]}</h4>
                <span style={{ fontSize: '28px', color: '#ff4444' }}>🪖 {G.territories[targetTerritory].armies}</span>
              </div>
            </div>

            {G.lastCombat && G.lastCombat.sourceId === selectedTerritory && G.lastCombat.targetId === targetTerritory && (
              <div style={{ backgroundColor: '#1a1a1a', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #333' }}>
                <h3 style={{ margin: '0 0 15px 0', fontSize: '20px', color: G.lastCombat.conquered ? '#5bc0de' : '#ffdd55' }}>
                  {G.lastCombat.conquered ? '🚩 FORÇAS INIMIGAS ESMAGADAS' : '🛡️ INVASÃO REPELIDA'}
                </h3>
                {G.lastCombat.type === 'CLASSIC' ? (
                  <div style={{ fontSize: '16px', lineHeight: '1.6' }}>
                    Dados do Ataque: <strong style={{ color: '#5bc0de' }}>[{G.lastCombat.attackRolls.join(', ')}]</strong> <br/>
                    Dados da Defesa: <strong style={{ color: '#ff4444' }}>[{G.lastCombat.defenseRolls.join(', ')}]</strong>
                  </div>
                ) : (
                  <div style={{ fontSize: '16px', color: '#ccc' }}>
                    Atrito contínuo de <strong>{G.lastCombat.rounds} rodada(s)</strong>.
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', marginTop: '15px', paddingTop: '15px', borderTop: '1px dashed #444', fontWeight: 'bold' }}>
                  <div style={{ color: '#ff5555' }}>Suas Baixas: -{G.lastCombat.attackerLosses}</div>
                  <div style={{ color: '#ffff55' }}>Baixas Inimigas: -{G.lastCombat.defenderLosses}</div>
                </div>
              </div>
            )}

            {(!G.lastCombat || G.lastCombat.sourceId !== selectedTerritory || G.lastCombat.targetId !== targetTerritory || (!G.lastCombat.conquered && G.territories[selectedTerritory].armies >= 2)) && (
               <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                 <button onClick={() => moves.declareAttack(selectedTerritory, targetTerritory)} style={{ flex: 1, padding: '15px', backgroundColor: '#5bc0de', color: 'black', border: 'none', fontWeight: 'bold', cursor: 'pointer', borderRadius: '5px', fontSize: '14px' }}>
                   {G.lastCombat && G.lastCombat.sourceId === selectedTerritory && G.lastCombat.targetId === targetTerritory ? 'Atacar Novamente (Clássico)' : '🎲 Ataque Clássico'}
                 </button>
                 <button onClick={() => moves.blitzAttack(selectedTerritory, targetTerritory)} style={{ flex: 1, padding: '15px', backgroundColor: '#d9534f', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer', borderRadius: '5px', fontSize: '14px' }}>
                   {G.lastCombat && G.lastCombat.sourceId === selectedTerritory && G.lastCombat.targetId === targetTerritory ? 'Atacar Novamente (Blitz)' : '⚡ Ataque Blitz'}
                 </button>
               </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => { setTargetTerritory(null); }} style={{ flex: 1, padding: '12px', backgroundColor: '#444', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer', borderRadius: '5px' }}>
                Retirar Tropas (Voltar)
              </button>
              {G.lastCombat && !G.lastCombat.conquered && G.lastCombat.sourceId === selectedTerritory && G.lastCombat.targetId === targetTerritory && (
                <button onClick={() => { events.setStage('maneuver'); setSelectedTerritory(null); setTargetTerritory(null); }} style={{ flex: 1, padding: '12px', backgroundColor: '#1a1a1a', color: '#ffdd55', border: '2px solid #ffdd55', fontWeight: 'bold', cursor: 'pointer', borderRadius: '5px' }}>
                  🏳️ Declarar Trégua (Encerrar Fase)
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CABEÇALHO DO JOGO (Título e Zoom) */}
      <div style={{ padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <h1 style={{ margin: 0, fontSize: '24px' }}>{isBuilderMode ? '🛠️ CONSTRUTOR ATIVO' : 'WAR: Metrópole Fluminense'}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#222', padding: '5px 10px', borderRadius: '5px', border: '1px solid #444' }}>
            <button onClick={handleZoomOut} style={{ backgroundColor: '#444', color: 'white', border: 'none', borderRadius: '3px', width: '24px', height: '24px', cursor: 'pointer', fontWeight: 'bold' }}>-</button>
            <span style={{ fontSize: '14px', color: '#ffdd55', minWidth: '85px', textAlign: 'center', fontWeight: 'bold' }}>Zoom: {Math.round(mapScale * 100)}%</span>
            <button onClick={handleZoomIn} style={{ backgroundColor: '#444', color: 'white', border: 'none', borderRadius: '3px', width: '24px', height: '24px', cursor: 'pointer', fontWeight: 'bold' }}>+</button>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          {isBuilderMode && (
            <>
              <div style={{ backgroundColor: '#222', padding: '6px 12px', borderRadius: '5px', display: 'flex', gap: '10px', border: '1px solid #444', alignItems: 'center', marginRight: '10px' }}>
                <span style={{ color: '#5bc0de', fontSize: '12px' }}>🗺️ No Mapa: {placedCount}</span>
                <span style={{ color: '#ffaa00', fontSize: '12px' }}>⬇ Bandeja: {trayCount}</span>
              </div>
              <button onClick={copyConfigToClipboard} style={{ padding: '6px 12px', backgroundColor: '#5bc0de', color: 'black', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>💾 Copiar Config</button>
              <button onClick={() => { if(window.confirm("Resetar TUDO?")) { setMapConfig(generateInitialConfig()); localStorage.removeItem('warMapConfig'); } }} style={{ padding: '6px 12px', backgroundColor: '#8b0000', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>🗑️ Reset</button>
            </>
          )}
          <button onClick={() => setIsBuilderMode(!isBuilderMode)} style={{ padding: '6px 12px', backgroundColor: isBuilderMode ? '#ff4444' : '#444', color: 'white', border: '1px solid #666', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>{isBuilderMode ? '❌ Sair do Construtor' : '🛠️ Ligar Modo Construtor'}</button>
        </div>
      </div>

      {/* NOVA BARRA TÁTICA (STICKY HUD) */}
      {!isBuilderMode && !currentPlayer.eliminated && (
        <div style={{ position: 'sticky', top: 0, zIndex: 5000, backgroundColor: '#1a1a1a', borderBottom: '1px solid #333', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', boxSizing: 'border-box', boxShadow: '0 4px 10px rgba(0,0,0,0.5)' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', width: '25%' }}>
            <div style={{ width: '20px', height: '20px', backgroundColor: currentPlayer.color, border: '2px solid #fff', borderRadius: '3px' }} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <strong style={{ fontSize: '18px', color: '#eaeaea', margin: 0, lineHeight: '1.2' }}>{currentPlayer.faction}</strong>
              <span style={{ fontSize: '12px', color: '#888' }}>Jogador {ctx.currentPlayer}</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
            <strong style={{ fontSize: '20px', color: getStageColor(currentStage), textTransform: 'uppercase', letterSpacing: '1px' }}>
              {getStageName(currentStage)}
            </strong>
            <div style={{ fontSize: '13px', color: '#ccc', marginTop: '4px', minHeight: '18px' }}>
              {getStageContextText()}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', width: 'auto', justifyContent: 'flex-end' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setIsObjectiveVisible(true)} style={{ padding: '8px 12px', backgroundColor: '#333', color: 'white', border: '1px solid #555', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                🎯 Objetivo
              </button>
              <button onClick={() => setIsLogVisible(!isLogVisible)} style={{ padding: '8px 12px', backgroundColor: isLogVisible ? '#ffdd55' : '#333', color: isLogVisible ? 'black' : 'white', border: '1px solid #555', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                📜 Log ({G.log ? G.log.length : 0})
              </button>
              <button onClick={() => setIsCardsVisible(true)} style={{ padding: '8px 12px', backgroundColor: isMandatoryTrade ? '#ff4444' : '#333', color: 'white', border: isMandatoryTrade ? '1px solid #ffaa00' : '1px solid #555', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', boxShadow: isMandatoryTrade ? '0 0 10px #ff4444' : 'none' }}>
                {isMandatoryTrade ? `🚨 Obrigatório (${numCards})` : `🗃️ Cartas (${numCards})`}
              </button>
            </div>

            <div style={{ width: '1px', height: '40px', backgroundColor: '#444', margin: '0 5px' }} />

            <button onClick={handleNextStep} disabled={isNextButtonDisabled} style={{ padding: '10px 20px', backgroundColor: isNextButtonDisabled ? '#333' : '#5bc0de', color: isNextButtonDisabled ? '#666' : 'black', border: 'none', borderRadius: '5px', fontWeight: 'bold', fontSize: '14px', cursor: isNextButtonDisabled ? 'not-allowed' : 'pointer', transition: 'background-color 0.2s' }}>
              {getNextButtonText()}
            </button>
          </div>
        </div>
      )}

      {/* BANNER DE FORTALECIMENTO INICIAL */}
      {!isBuilderMode && ctx.phase === 'initialReinforcement' && !currentPlayer.eliminated && (
        <div style={{ backgroundColor: '#1a1a00', color: '#ffdd55', textAlign: 'center', padding: '10px', fontSize: '14px', fontWeight: 'bold', borderBottom: '1px solid #333' }}>
          ⏳ FASE DE FORTALECIMENTO INICIAL - Posicione suas tropas para assegurar suas fronteiras antes da guerra começar.
        </div>
      )}

      {/* RENDERIZAÇÃO DO TABULEIRO DE GUERRA (A MESA) */}
      <div style={{ width: '100%', overflow: 'hidden', display: 'flex', justifyContent: 'center', flex: 1 }}>
        <div style={{ 
          position: 'relative', width: '1600px', height: `${currentMapHeight}px`, transform: `scale(${mapScale})`, transformOrigin: 'top center',
          marginBottom: `${-(currentMapHeight * (1 - mapScale))}px`, marginTop: '20px', backgroundColor: isBuilderMode ? '#222' : '#1a1a1a', 
          backgroundImage: isBuilderMode ? 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)' : 'none', 
          backgroundSize: '50px 50px', border: '4px solid #444', borderRadius: '12px'
        }}>
          {isBuilderMode && <div style={{ position: 'absolute', top: '900px', left: 0, width: '100%', height: '5px', backgroundColor: '#ffaa00', zIndex: 1 }} />}
          {isBuilderMode && <h2 style={{ position: 'absolute', top: '910px', left: '20px', color: '#ffaa00', zIndex: 1 }}>⬇ BANDEJA DE TERRITÓRIOS (Arraste para Cima) ⬇</h2>}

          {Object.keys(G.territories).map(id => {
            const data = G.territories[id];
            const ownerData = G.players[data.owner];
            const isSelected = isBuilderMode ? (editTarget === id) : (selectedTerritory === id);
            const isTarget = !isBuilderMode && targetTerritory === id;
            
            let isHighlight = false; let highlightColor = '';
            
            if (!isBuilderMode && currentStage === 'attack' && selectedTerritory) {
                isHighlight = G.connections[selectedTerritory]?.includes(id) && ownerData.faction !== currentPlayer.faction;
                highlightColor = '#ffdd55'; 
            } else if (!isBuilderMode && currentStage === 'maneuver' && selectedTerritory) {
                isHighlight = reachableNetwork.includes(id) && id !== selectedTerritory;
                highlightColor = '#5bc0de'; 
            }

            let bgColor;
            if (isTarget) {
              bgColor = '#522';
            } else if (isSelected) {
              bgColor = hexToRgba(ownerData.color, 0.7);
            } else if (isHighlight && currentStage === 'attack') {
              bgColor = 'rgba(200, 150, 0, 0.6)'; 
            } else if (isHighlight && currentStage === 'maneuver') {
              bgColor = 'rgba(0, 100, 200, 0.6)'; 
            } else {
              bgColor = hexToRgba(ownerData.color, 0.45); 
            }

            const isDimmed = !isBuilderMode && selectedTerritory && !isSelected && !isHighlight && !isTarget;
            const borderColor = isTarget ? '#ff4444' : isSelected ? '#ffffff' : (isHighlight ? highlightColor : ownerData.color);
            
            let filterStyle = 'drop-shadow(2px 4px 6px rgba(0,0,0,0.8))'; 
            if (isTarget) filterStyle += ' drop-shadow(0 0 10px #ff4444)';
            else if (isSelected) filterStyle += ' drop-shadow(0 0 10px #ffffff)';
            else if (isHighlight && currentStage === 'attack') filterStyle += ' drop-shadow(0 0 10px #ffaa00)';
            else if (isHighlight && currentStage === 'maneuver') filterStyle += ' drop-shadow(0 0 10px #5bc0de)';

            const config = mapConfig[id] || { img: 'mapa_generico.png', top: 950, left: 20, width: 100, height: 100 };
            const customMask = config.img;

            return (
              <div key={id} onPointerDown={(e) => startDrag(e, id, 'drag')} onClick={() => handleTerritoryClick(id)}
                style={{
                  position: 'absolute', top: `${config.top}px`, left: `${config.left}px`, width: `${config.width}px`, height: `${config.height}px`,
                  cursor: isBuilderMode ? (dragInfo ? 'grabbing' : 'grab') : (isDimmed ? 'not-allowed' : 'pointer'), 
                  opacity: isDimmed ? 0.3 : 1, transition: isBuilderMode ? 'none' : 'all 0.3s ease-in-out', 
                  transform: (!isBuilderMode && (isSelected || isTarget)) ? 'scale(1.1)' : 'scale(1)', zIndex: isSelected ? 100 : 10, 
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', filter: filterStyle
                }}
              >
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: bgColor,
                  WebkitMaskImage: `url(/${customMask})`, maskImage: `url(/${customMask})`, WebkitMaskSize: 'contain', maskSize: 'contain',
                  WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat', WebkitMaskPosition: 'center', maskPosition: 'center', 
                  zIndex: -1, pointerEvents: 'none'
                }} />

                {!isBuilderMode && (
                  <div style={{
                    width: '10px', height: '10px', borderRadius: '50%', backgroundColor: ownerData.color, border: '1px solid #fff', 
                    marginBottom: '4px', boxShadow: '0 0 4px #000', zIndex: 1, pointerEvents: 'none'
                  }} />
                )}

                <h3 style={{ 
                  fontSize: '11px', margin: '0', textTransform: 'uppercase', fontWeight: 'bold', pointerEvents: 'none', zIndex: 2,
                  textShadow: '1px 1px 0px #000, -1px -1px 0px #000, 1px -1px 0px #000, -1px 1px 0px #000, 2px 2px 4px rgba(0,0,0,0.8)' 
                }}>{territoryNames[id]}</h3>
                
                {!isBuilderMode && (
                  <p style={{ 
                    fontSize: '16px', margin: '0', fontWeight: 'bold', pointerEvents: 'none', zIndex: 2,
                    textShadow: '1px 1px 0px #000, -1px -1px 0px #000, 1px -1px 0px #000, -1px 1px 0px #000, 2px 2px 4px rgba(0,0,0,0.8)'
                  }}>🪖 {data.armies}</p>
                )}

                {isBuilderMode && isSelected && (
                  <div onPointerDown={(e) => startDrag(e, id, 'resize-se')}
                    style={{ position: 'absolute', right: '-8px', bottom: '-8px', width: '16px', height: '16px', backgroundColor: '#ffaa00', border: '2px solid white', cursor: 'nwse-resize', zIndex: 200, borderRadius: '50%' }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}