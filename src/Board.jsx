// src/Board.jsx
import React, { useState, useEffect } from 'react';
import { territoryNames } from './Game'; 

// ============================================================================
// MAPEAMENTO DAS IMAGENS (Apenas qual PNG pertence a quem)
// ============================================================================
const imageMapping = {
  'N07_IpanemaLeblon': 'mapa1.png', 'N08_RocinhaGavea': 'mapa2.png', 'N06_Copacabana': 'mapa3.png',
  'N05_GloriaBotafogo': 'mapa4.png', 'N02_Lapa': 'mapa5.png', 'N01_Centro': 'mapa6.png',
  'N03_Saude': 'mapa7.png', 'N04_RioComprido': 'mapa8.png', 'N09_GrandeTijuca': 'mapa9.png',
  'N10_SaoCristovao': 'mapa10.png', 'N11_ComplexoAlemao': 'mapa11.png', 'N12_GrandeMeier': 'mapa12.png',
  'N13_Madureira': 'mapa13.png', 'N14_Pavuna': 'mapa14.png', 'N15_IlhaGovernador': 'mapa.png',
  'N16_BarraTijuca': 'mapa15.png', 'N17_Jacarepagua': 'mapa16.png', 'N18_Bangu': 'mapa17.png',
  'N19_CampoGrande': 'mapa18.png', 'N20_SantaCruz': 'mapa19.png', 'N21_Guaratiba': 'mapa20.png',
  'N24_Nilopolis': 'mapa24.png', 'N25_Mesquita': 'mapa25.png', 'N26_BelfordRoxo': 'mapa26.png',
  'N27_NovaIguacu': 'mapa27.png', 'N28_Queimados': 'mapa28.png', 'N29_Japeri': 'mapa29.png',
  'N23_SaoJoaoMeriti': 'mapa23.png', 'N22_DuqueCaxias': 'mapa22.png', 'N30_Mage': 'mapa30.png',
  'N31_CentroNit': 'mapa31.png', 'N35_Fonseca': 'mapa35.png', 'N36_Engenhoca': 'mapa36.png',
  'N32_Icarai': 'mapa32.png', 'N34_Pendotiba': 'mapa34.png', 'N33_RegiaoOceanica': 'mapa33.png',
  'N37_Neves': 'mapa37.png', 'N38_ZeGaroto': 'mapa38.png', 'N39_Mutua': 'mapa39.png',
  'N40_Alcantara': 'mapa40.png', 'N41_JardimCatarina': 'mapa41.png', 'N42_Guaxindiba': 'mapa42.png'
};

// Função que gera a Bandeja Inicial (todos os territórios em grade no fundo da tela)
const generateInitialConfig = () => {
  const config = {};
  let x = 20, y = 950; // Começam na altura 950 (na bandeja)
  Object.keys(territoryNames).forEach(id => {
    config[id] = { img: imageMapping[id] || 'mapa_generico.png', top: y, left: x, width: 100, height: 100 };
    x += 120;
    if (x > 1400) { x = 20; y += 120; }
  });
  return config;
};

export function WarBoard({ G, ctx, moves, events }) {
  const currentPlayer = G.players[ctx.currentPlayer];
  const [selectedTerritory, setSelectedTerritory] = useState(null);
  const [targetTerritory, setTargetTerritory] = useState(null); 
  const [selectedCards, setSelectedCards] = useState([]);
  
  const [isObjectiveVisible, setIsObjectiveVisible] = useState(false);
  const [isCardsVisible, setIsCardsVisible] = useState(false);

  // ============================================================================
  // MODO CONSTRUTOR (LEVEL EDITOR)
  // ============================================================================
  const [isBuilderMode, setIsBuilderMode] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [dragInfo, setDragInfo] = useState(null);
  const [mapConfig, setMapConfig] = useState(() => {
    const saved = localStorage.getItem('warMapConfig');
    return saved ? JSON.parse(saved) : generateInitialConfig();
  });

  // Salva no LocalStorage sempre que soltar o mouse
  useEffect(() => {
    if (!dragInfo) {
      localStorage.setItem('warMapConfig', JSON.stringify(mapConfig));
    }
  }, [dragInfo, mapConfig]);

  // Motor de Arrastar e Redimensionar
  useEffect(() => {
    const handlePointerMove = (e) => {
      if (!dragInfo) return;
      e.preventDefault();
      
      const dx = e.pageX - dragInfo.startX;
      const dy = e.pageY - dragInfo.startY;

      setMapConfig(prev => {
        const updated = { ...prev };
        const t = updated[editTarget];
        if (!t) return prev;

        let newLeft = dragInfo.initialLeft;
        let newTop = dragInfo.initialTop;
        let newWidth = dragInfo.initialWidth;
        let newHeight = dragInfo.initialHeight;

        if (dragInfo.action === 'drag') {
          newLeft += dx;
          newTop += dy;
        } else if (dragInfo.action === 'resize-se') {
          newWidth = Math.max(30, newWidth + dx); // Largura mínima 30px
          newHeight = Math.max(30, newHeight + dy); // Altura mínima 30px
        }

        updated[editTarget] = { ...t, left: newLeft, top: newTop, width: newWidth, height: newHeight };
        return updated;
      });
    };

    const handlePointerUp = () => {
      if (dragInfo) setDragInfo(null);
    };

    if (dragInfo) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    }
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [dragInfo, editTarget]);

  const startDrag = (e, id, action) => {
    if (!isBuilderMode) return;
    e.stopPropagation();
    setEditTarget(id);
    const t = mapConfig[id];
    setDragInfo({
      action,
      startX: e.pageX,
      startY: e.pageY,
      initialLeft: t.left,
      initialTop: t.top,
      initialWidth: t.width,
      initialHeight: t.height
    });
  };

  const copyConfigToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(mapConfig, null, 2));
    alert("Configuração copiada para a área de transferência!");
  };

  // ============================================================================
  // LÓGICA PADRÃO DO JOGO
  // ============================================================================
  useEffect(() => {
    if (!isBuilderMode) {
      setIsObjectiveVisible(false);
      setIsCardsVisible(false);
      setSelectedTerritory(null);
      setTargetTerritory(null);
      setSelectedCards([]);
    }
  }, [ctx.currentPlayer, isBuilderMode]);

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

  const reachableNetwork = (currentStage === 'maneuver' && selectedTerritory) ? getReachableTerritories(selectedTerritory) : [];

  const handleTerritoryClick = (id) => {
    if (isBuilderMode) {
      setEditTarget(id);
      return;
    }
    if (currentPlayer.eliminated) return;
    if (G.pendingOccupation) { alert("Resolva a ocupação primeiro!"); return; }

    if (currentStage === 'reinforcement') {
      moves.placeArmy(id);
    } else if (currentStage === 'attack' || currentStage === 'maneuver') {
      if (!selectedTerritory) {
        if (G.territories[id].owner !== ctx.currentPlayer) { alert("Selecione um território SEU."); return; }
        setSelectedTerritory(id);
      } else if (selectedTerritory === id) {
        setSelectedTerritory(null); setTargetTerritory(null);
      } else {
        if (currentStage === 'maneuver') { moves.moveArmy(selectedTerritory, id); setSelectedTerritory(null); } 
        else if (currentStage === 'attack') { setTargetTerritory(id); }
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

  return ctx.gameover ? (
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.95)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', zIndex: 10000, fontFamily: 'monospace', textAlign: 'center' }}>
        <h1 style={{ fontSize: '3em', color: G.players[ctx.gameover.winner].color }}>🏆 VITÓRIA! 🏆</h1>
        <h2 style={{ fontSize: '2em' }}>{G.players[ctx.gameover.winner].faction} dominou a Metrópole!</h2>
      </div>
    ) : (
      <div style={{ padding: '20px', backgroundColor: '#111', color: '#eaeaea', minHeight: '100vh', fontFamily: 'monospace' }}>
        
        {/* CABEÇALHO COM CONTROLES DO MODO CONSTRUTOR */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', backgroundColor: isBuilderMode ? '#331a00' : 'transparent', padding: isBuilderMode ? '15px' : '0', borderRadius: '8px', border: isBuilderMode ? '2px dashed #ffaa00' : 'none' }}>
          <h1 style={{ margin: 0 }}>{isBuilderMode ? '🛠️ MODO CONSTRUTOR ATIVO' : 'WAR: Metrópole Fluminense'}</h1>
          <div style={{ display: 'flex', gap: '10px' }}>
            {isBuilderMode && (
              <>
                <button onClick={copyConfigToClipboard} style={{ padding: '8px 15px', backgroundColor: '#5bc0de', color: 'black', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                  💾 Copiar Configurações
                </button>
                <button onClick={() => { if(window.confirm("Resetar TUDO para a Bandeja?")) { setMapConfig(generateInitialConfig()); localStorage.removeItem('warMapConfig'); } }} style={{ padding: '8px 15px', backgroundColor: '#8b0000', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                  🗑️ Resetar Mapa
                </button>
              </>
            )}
            <button onClick={() => setIsBuilderMode(!isBuilderMode)} style={{ padding: '8px 15px', backgroundColor: isBuilderMode ? '#ff4444' : '#444', color: 'white', border: '1px solid #666', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
              {isBuilderMode ? '❌ Sair do Construtor' : '🛠️ Ligar Modo Construtor'}
            </button>
          </div>
        </div>

        {/* PAINEL TÁTICO NORMAL (Oculto no Modo Construtor para focar no mapa) */}
        {!isBuilderMode && !currentPlayer.eliminated && (
          <div style={{ marginBottom: '20px', padding: '15px', border: `2px solid ${currentPlayer.color}`, backgroundColor: '#1a1a1a', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '15px', borderRadius: '8px' }}>
            {/* ... HUD Padrão Resumido ... */}
            <div style={{ flex: '1', minWidth: '250px' }}>
              <p>Comandante: <strong style={{color: currentPlayer.color}}>{currentPlayer.faction}</strong> | Fase: <strong style={{color: '#ffdd55'}}>{ctx.phase === 'initialReinforcement' ? 'FORTALECIMENTO INICIAL' : stageNames[currentStage]}</strong></p>
              {currentStage === 'reinforcement' && <p>Reforços: <strong>🪖 {G.troopsToPlace}</strong></p>}
              {selectedTerritory && <p>Origem: <span style={{color: '#5bc0de'}}>{territoryNames[selectedTerritory]}</span></p>}
              <button onClick={handleNextStep} disabled={isNextButtonDisabled} style={{ marginTop: '10px', padding: '10px 20px', cursor: isNextButtonDisabled ? 'not-allowed' : 'pointer', backgroundColor: '#5bc0de', color: 'black', border: 'none', fontWeight: 'bold' }}>Avançar Fase ➔</button>
            </div>
            {/* Omitido o resto do HUD visual aqui por economia de espaço para o editor, o jogo continua rodando normal! */}
          </div>
        )}

        {/* ================================================================= */}
        {/* A MESA DO TABULEIRO & BANDEJA DE PEÇAS                            */}
        {/* ================================================================= */}
        
        <div style={{
            position: 'relative',
            width: '1600px', 
            height: isBuilderMode ? '1600px' : '900px', // Cresce para mostrar a bandeja no Modo Construtor
            margin: '0 auto',
            backgroundColor: isBuilderMode ? '#222' : '#1a1a1a',
            backgroundImage: isBuilderMode ? 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)' : 'none', // Grade de fundo
            backgroundSize: '50px 50px',
            border: '4px solid #444',
            borderRadius: '12px',
            overflow: 'hidden' 
        }}>

          {/* Linha Divisória da Bandeja (Só aparece no construtor) */}
          {isBuilderMode && (
            <div style={{ position: 'absolute', top: '900px', left: 0, width: '100%', height: '5px', backgroundColor: '#ffaa00', zIndex: 1 }} />
          )}
          {isBuilderMode && (
            <h2 style={{ position: 'absolute', top: '910px', left: '20px', color: '#ffaa00', zIndex: 1 }}>⬇ BANDEJA DE TERRITÓRIOS (Arraste para Cima) ⬇</h2>
          )}

          {Object.keys(G.territories).map(id => {
            const data = G.territories[id];
            const ownerData = G.players[data.owner];
            const isSelected = isBuilderMode ? (editTarget === id) : (selectedTerritory === id);
            const isTarget = !isBuilderMode && targetTerritory === id;
            
            let isHighlight = false;
            let highlightColor = '';
            
            if (!isBuilderMode && currentStage === 'attack' && selectedTerritory) {
                isHighlight = G.connections[selectedTerritory]?.includes(id) && ownerData.faction !== currentPlayer.faction;
                highlightColor = '#ffdd55'; 
            } else if (!isBuilderMode && currentStage === 'maneuver' && selectedTerritory) {
                isHighlight = reachableNetwork.includes(id) && id !== selectedTerritory;
                highlightColor = '#5bc0de'; 
            }

            const isDimmed = !isBuilderMode && selectedTerritory && !isSelected && !isHighlight && !isTarget;
            const borderColor = isTarget ? '#ff4444' : isSelected ? '#ffffff' : (isHighlight ? highlightColor : ownerData.color);
            const bgColor = isSelected ? '#666' : isTarget ? '#522' : '#2a2a2a';
            
            // Puxa as configurações VIVAS do state do Editor
            const config = mapConfig[id] || { img: 'mapa_generico.png', top: 950, left: 20, width: 100, height: 100 };
            const customMask = config.img;

            return (
              <div key={id} 
                onPointerDown={(e) => startDrag(e, id, 'drag')}
                onClick={() => handleTerritoryClick(id)}
                style={{
                  position: 'absolute', 
                  top: `${config.top}px`,      
                  left: `${config.left}px`,    
                  width: `${config.width}px`,
                  height: `${config.height}px`,
                  cursor: isBuilderMode ? (dragInfo ? 'grabbing' : 'grab') : (isDimmed ? 'not-allowed' : 'pointer'), 
                  opacity: isDimmed ? 0.3 : 1,
                  transition: isBuilderMode ? 'none' : 'all 0.3s ease-in-out', 
                  transform: (!isBuilderMode && (isSelected || isTarget)) ? 'scale(1.1)' : 'scale(1)',
                  zIndex: isSelected ? 100 : 10, 
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  filter: `
                    drop-shadow(3px 0px 0px ${borderColor}) drop-shadow(-3px 0px 0px ${borderColor})
                    drop-shadow(0px 3px 0px ${borderColor}) drop-shadow(0px -3px 0px ${borderColor})
                    ${isHighlight ? `drop-shadow(0 0 15px ${highlightColor})` : ''}
                  `
                }}
              >
                {/* MÁSCARA DO TERRITÓRIO */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                  backgroundColor: bgColor,
                  WebkitMaskImage: `url(/${customMask})`, maskImage: `url(/${customMask})`,
                  WebkitMaskSize: 'contain', maskSize: 'contain',
                  WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat',
                  WebkitMaskPosition: 'center', maskPosition: 'center', 
                  zIndex: -1, pointerEvents: 'none' // Para não atrapalhar o drag
                }} />
                
                {/* TEXTOS */}
                <h3 style={{ fontSize: '11px', margin: '0', textTransform: 'uppercase', textShadow: '2px 2px 4px rgba(0,0,0,0.8)', pointerEvents: 'none' }}>
                  {territoryNames[id]}
                </h3>
                {!isBuilderMode && (
                  <p style={{ fontSize: '16px', margin: '0', textShadow: '2px 2px 4px rgba(0,0,0,0.8)', fontWeight: 'bold', pointerEvents: 'none' }}>
                    🪖 {data.armies}
                  </p>
                )}

                {/* ALÇA DE REDIMENSIONAMENTO (Aparece só no modo construtor) */}
                {isBuilderMode && isSelected && (
                  <div
                    onPointerDown={(e) => startDrag(e, id, 'resize-se')}
                    style={{
                      position: 'absolute',
                      right: '-8px',
                      bottom: '-8px',
                      width: '16px',
                      height: '16px',
                      backgroundColor: '#ffaa00',
                      border: '2px solid white',
                      cursor: 'nwse-resize',
                      zIndex: 200,
                      borderRadius: '50%'
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

      </div>
    );
}