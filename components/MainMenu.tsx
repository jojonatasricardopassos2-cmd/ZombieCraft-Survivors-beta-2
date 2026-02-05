
import React, { useState, useEffect } from 'react';
import { TRANSLATIONS } from '../constants.ts';
import { SavedWorld, GameOptions } from '../types.ts';
import { loadAllSavesMetadata, loadWorldFromDB, saveWorldToDB, deleteWorldFromDB } from '../utils/storage.ts';

interface MainMenuProps {
  onStartGame: (world: SavedWorld | null, newWorldConfig?: { name: string, seed: number, options: GameOptions }) => void;
  lang: 'EN' | 'PT';
  setLang: (l: 'EN' | 'PT') => void;
}

type MenuState = 'MAIN' | 'SELECT_WORLD' | 'CREATE_WORLD' | 'OPTIONS' | 'ONLINE_LOBBY' | 'CREATE_ROOM' | 'JOIN_ROOM';

export const MainMenu: React.FC<MainMenuProps> = ({ onStartGame, lang, setLang }) => {
  const [menuState, setMenuState] = useState<MenuState>('MAIN');
  const [saves, setSaves] = useState<SavedWorld[]>([]);
  const [selectedWorldId, setSelectedWorldId] = useState<string | null>(null);
  
  // Options
  const [showCoordinates, setShowCoordinates] = useState(false);
  const [adminMode, setAdminMode] = useState(false);
  const [isMobile, setIsMobile] = useState(false); // Mobile Toggle
  const [showAdminConfirm, setShowAdminConfirm] = useState(false);

  // Create World Inputs
  const [newWorldName, setNewWorldName] = useState('New World');
  const [newWorldSeed, setNewWorldSeed] = useState('');

  // Multiplayer Inputs
  const [roomName, setRoomName] = useState('My Server');
  const [roomCode, setRoomCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [hostWorldId, setHostWorldId] = useState<string | null>(null); // For hosting existing world

  const t = TRANSLATIONS[lang];

  useEffect(() => {
      // Check for mobile device initially
      if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
          setIsMobile(true);
      }

      const migrate = async () => {
          const lsSaves = localStorage.getItem('mr2d_saves');
          if (lsSaves) {
              try {
                  const parsed: SavedWorld[] = JSON.parse(lsSaves);
                  for (const s of parsed) {
                      await saveWorldToDB(s);
                  }
                  localStorage.removeItem('mr2d_saves');
                  console.log("Migrated saves to IndexedDB");
              } catch (e) {
                  console.error("Migration failed", e);
              }
          }
          loadList();
      };
      
      const loadList = async () => {
          try {
              const list = await loadAllSavesMetadata();
              // Sort by last played
              list.sort((a, b) => b.lastPlayed - a.lastPlayed);
              setSaves(list);
          } catch (e) {
              console.error("Failed to load save list", e);
          }
      }

      migrate();
  }, [menuState]);

  const handleCreateWorld = () => {
      const seed = newWorldSeed.trim() === '' ? Math.floor(Math.random() * 999999) : parseInt(newWorldSeed) || 0;
      onStartGame(null, { name: newWorldName, seed, options: { showCoordinates, adminMode, isMobile } });
  };

  const handlePlaySelected = async () => {
      if (!selectedWorldId) return;
      try {
          // Fetch full world data because the list only has lightweight metadata
          const world = await loadWorldFromDB(selectedWorldId);
          if (world) {
              if (!world.options) world.options = { showCoordinates, adminMode, isMobile };
              else {
                  world.options.showCoordinates = showCoordinates;
                  world.options.adminMode = adminMode; // Inject current global preference
                  world.options.isMobile = isMobile;
              }
              onStartGame(world);
          } else {
              alert("Error: World data not found!");
          }
      } catch (e) {
          console.error(e);
          alert("Failed to load world.");
      }
  };
  
  const handleDeleteWorld = async () => {
      if(!selectedWorldId) return;
      try {
          await deleteWorldFromDB(selectedWorldId);
          const newSaves = saves.filter(s => s.id !== selectedWorldId);
          setSaves(newSaves);
          setSelectedWorldId(null);
      } catch (e) {
          console.error("Delete failed", e);
      }
  }

  // --- MULTIPLAYER HANDLERS ---

  const generateRoomCode = () => {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      setRoomCode(code);
  };

  useEffect(() => {
      if (menuState === 'CREATE_ROOM') {
          generateRoomCode();
      }
  }, [menuState]);

  const handleHostGame = async () => {
      const multiplayerConfig = {
          mode: 'HOST' as const,
          roomId: roomCode,
          playerName: 'Host'
      };

      if (hostWorldId) {
          // Load existing world and add MP config
          const world = await loadWorldFromDB(hostWorldId);
          if (world) {
              if (!world.options) world.options = { showCoordinates, adminMode, isMobile };
              world.options.multiplayer = multiplayerConfig;
              world.options.isMobile = isMobile; // Ensure mobile setting persists
              onStartGame(world);
          }
      } else {
          // New World
          const seed = Math.floor(Math.random() * 999999);
          onStartGame(null, { 
              name: roomName, 
              seed, 
              options: { 
                  showCoordinates, 
                  adminMode,
                  isMobile,
                  multiplayer: multiplayerConfig
              } 
          });
      }
  };

  const handleJoinGame = () => {
      if (!joinCode) return;
      // In a real app, this would fetch the world from a server.
      // Here we simulate joining by generating a new world but flagging it as Client
      // Note: Client connects to an empty world in this simulation because we can't share state without backend.
      const seed = 12345; // Fixed seed for join simulation
      onStartGame(null, { 
          name: `Joined Room ${joinCode}`, 
          seed, 
          options: { 
              showCoordinates, 
              adminMode,
              isMobile,
              multiplayer: {
                  mode: 'CLIENT',
                  roomId: joinCode,
                  playerName: 'Guest'
              }
          } 
      });
  };

  const renderMain = () => (
    <div className="flex flex-col gap-4 w-64">
        <button 
          onClick={() => setMenuState('SELECT_WORLD')}
          className="bg-gray-700 hover:bg-green-600 text-white p-4 border-2 border-gray-400 font-mono text-xl transition-colors shadow-lg"
        >
          {t.PLAY}
        </button>
        <button 
          onClick={() => setMenuState('ONLINE_LOBBY')}
          className="bg-purple-900 hover:bg-purple-700 text-white p-4 border-2 border-purple-400 font-mono text-xl transition-colors shadow-lg"
        >
          {t.ONLINE_MODE}
        </button>
        <button 
          onClick={() => setMenuState('OPTIONS')}
          className="bg-gray-700 hover:bg-blue-600 text-white p-4 border-2 border-gray-400 font-mono text-xl transition-colors shadow-lg"
        >
          {t.OPTIONS}
        </button>
    </div>
  );

  const renderOnlineLobby = () => (
      <div className="flex flex-col gap-4 w-[500px] bg-gray-900/90 border-4 border-purple-500 p-6 shadow-2xl">
          <h2 className="text-2xl text-purple-300 font-bold text-center border-b border-purple-800 pb-4">{t.ONLINE_MODE}</h2>
          
          <div className="flex gap-4 h-40 items-center justify-center">
              <button 
                  onClick={() => setMenuState('CREATE_ROOM')}
                  className="w-1/2 h-full bg-purple-800 hover:bg-purple-600 border-2 border-purple-400 rounded flex flex-col items-center justify-center gap-2"
              >
                  <span className="text-4xl">🏠</span>
                  <span className="text-xl font-bold">{t.CREATE_ROOM}</span>
              </button>
              <button 
                  onClick={() => setMenuState('JOIN_ROOM')}
                  className="w-1/2 h-full bg-blue-900 hover:bg-blue-700 border-2 border-blue-400 rounded flex flex-col items-center justify-center gap-2"
              >
                  <span className="text-4xl">🔗</span>
                  <span className="text-xl font-bold">{t.JOIN_ROOM}</span>
              </button>
          </div>
          
          <div className="text-xs text-gray-400 text-center mt-2">
              {t.MULTIPLAYER_NOTE}
          </div>

          <button onClick={() => setMenuState('MAIN')} className="mt-4 text-gray-400 hover:text-white">{t.BACK}</button>
      </div>
  );

  const renderCreateRoom = () => (
      <div className="flex flex-col gap-4 w-[500px] bg-gray-900/90 border-4 border-purple-500 p-6 shadow-2xl text-white">
          <h2 className="text-2xl font-bold text-center mb-4 text-purple-300">{t.CREATE_ROOM}</h2>
          
          <div className="flex flex-col gap-1">
              <label className="text-gray-300 text-sm">{t.ROOM_NAME}</label>
              <input 
                type="text" 
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                className="bg-black/50 border border-purple-500 p-2 text-white"
                maxLength={20}
              />
          </div>

          <div className="flex flex-col gap-1">
              <label className="text-gray-300 text-sm">{t.ROOM_CODE}</label>
              <div className="bg-black border border-purple-500 p-4 text-center text-3xl font-mono tracking-widest text-yellow-400 select-all">
                  {roomCode}
              </div>
          </div>

          <div className="flex flex-col gap-1 mt-2">
              <label className="text-gray-300 text-sm">{t.SELECT_WORLD}</label>
              <div className="max-h-32 overflow-y-auto border border-gray-700 bg-black/30">
                  <div 
                      onClick={() => setHostWorldId(null)}
                      className={`p-2 cursor-pointer ${hostWorldId === null ? 'bg-purple-700' : 'hover:bg-gray-800'}`}
                  >
                      {t.NEW_WORLD}
                  </div>
                  {saves.map(save => (
                      <div 
                          key={save.id}
                          onClick={() => setHostWorldId(save.id)}
                          className={`p-2 cursor-pointer border-t border-gray-800 ${hostWorldId === save.id ? 'bg-purple-700' : 'hover:bg-gray-800'}`}
                      >
                          {save.name}
                      </div>
                  ))}
              </div>
          </div>

          <div className="flex flex-col gap-2 mt-4">
              <button 
                  onClick={handleHostGame}
                  className="bg-green-700 hover:bg-green-600 text-white p-3 border-2 border-green-500 font-bold shadow-md"
              >
                  {t.START_HOST}
              </button>
              <button 
                  onClick={() => setMenuState('ONLINE_LOBBY')}
                  className="bg-gray-700 hover:bg-gray-600 text-white p-3 border-2 border-gray-400 font-bold"
              >
                  {t.BACK}
              </button>
          </div>
      </div>
  );

  const renderJoinRoom = () => (
      <div className="flex flex-col gap-4 w-[400px] bg-gray-900/90 border-4 border-blue-500 p-6 shadow-2xl text-white">
          <h2 className="text-2xl font-bold text-center mb-4 text-blue-300">{t.JOIN_ROOM}</h2>
          
          <div className="flex flex-col gap-1">
              <label className="text-gray-300 text-sm">{t.ENTER_CODE}</label>
              <input 
                type="text" 
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="XXXXXX"
                className="bg-black/50 border border-blue-500 p-4 text-center text-2xl font-mono text-white tracking-widest uppercase"
                maxLength={6}
              />
          </div>

          <div className="flex flex-col gap-2 mt-4">
              <button 
                  onClick={handleJoinGame}
                  disabled={joinCode.length < 6}
                  className={`p-3 border-2 font-bold shadow-md ${joinCode.length < 6 ? 'bg-gray-700 text-gray-500 border-gray-600' : 'bg-green-700 hover:bg-green-600 text-white border-green-500'}`}
              >
                  {t.JOIN}
              </button>
              <button 
                  onClick={() => setMenuState('ONLINE_LOBBY')}
                  className="bg-gray-700 hover:bg-gray-600 text-white p-3 border-2 border-gray-400 font-bold"
              >
                  {t.BACK}
              </button>
          </div>
      </div>
  );

  const renderSelectWorld = () => (
      <div className="flex flex-col gap-4 w-[600px] h-[500px] bg-gray-800/90 border-4 border-gray-500 p-6 shadow-2xl">
          <h2 className="text-2xl text-white font-bold text-center border-b border-gray-600 pb-4">Select World</h2>
          
          <div className="flex-1 overflow-y-auto bg-black/40 border border-gray-700 p-2 flex flex-col gap-2">
              {saves.map(save => (
                  <div 
                    key={save.id}
                    onClick={() => setSelectedWorldId(save.id)}
                    className={`p-3 border cursor-pointer flex justify-between items-center ${selectedWorldId === save.id ? 'border-white bg-gray-700' : 'border-gray-600 hover:bg-gray-700/50'}`}
                  >
                      <div>
                          <div className="font-bold text-lg text-white">{save.name}</div>
                          <div className="text-xs text-gray-400">Seed: {save.seed} • {new Date(save.lastPlayed).toLocaleString()}</div>
                      </div>
                      <div className="text-gray-500">
                           ▶
                      </div>
                  </div>
              ))}
              {saves.length === 0 && <div className="text-gray-500 text-center mt-10">No saved worlds</div>}
          </div>

          <div className="flex gap-4 justify-center mt-2">
              <button 
                onClick={handlePlaySelected}
                disabled={!selectedWorldId}
                className={`flex-1 p-3 font-bold border-2 ${selectedWorldId ? 'bg-green-700 hover:bg-green-600 border-green-400 text-white' : 'bg-gray-700 border-gray-600 text-gray-500'}`}
              >
                  Play Selected
              </button>
              <button 
                onClick={() => setMenuState('CREATE_WORLD')}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white p-3 border-2 border-gray-400 font-bold"
              >
                  Create New World
              </button>
              <button 
                onClick={handleDeleteWorld}
                disabled={!selectedWorldId}
                className={`p-3 font-bold border-2 ${selectedWorldId ? 'bg-red-900 hover:bg-red-700 border-red-500 text-white' : 'bg-gray-700 border-gray-600 text-gray-500'}`}
              >
                  Delete
              </button>
          </div>
          <button onClick={() => setMenuState('MAIN')} className="mt-2 text-gray-400 hover:text-white">Cancel</button>
      </div>
  );

  const renderCreateWorld = () => (
      <div className="flex flex-col gap-4 w-[500px] bg-gray-800/90 border-4 border-gray-500 p-6 shadow-2xl text-white">
          <h2 className="text-2xl font-bold text-center mb-4">Create New World</h2>
          
          <div className="flex flex-col gap-1">
              <label className="text-gray-300 text-sm">World Name</label>
              <input 
                type="text" 
                value={newWorldName}
                onChange={(e) => setNewWorldName(e.target.value)}
                className="bg-black/50 border border-gray-500 p-2 text-white"
                maxLength={20}
              />
          </div>

          <div className="flex flex-col gap-1">
              <label className="text-gray-300 text-sm">Seed (Optional)</label>
              <input 
                type="text" 
                value={newWorldSeed}
                onChange={(e) => setNewWorldSeed(e.target.value)}
                placeholder="Leave blank for random"
                className="bg-black/50 border border-gray-500 p-2 text-white"
                maxLength={15}
              />
          </div>

          <div className="flex flex-col gap-2 mt-4">
              <button 
                  onClick={handleCreateWorld}
                  className="bg-green-700 hover:bg-green-600 text-white p-3 border-2 border-green-500 font-bold shadow-md"
              >
                  Create New World
              </button>
              <button 
                  onClick={() => setMenuState('SELECT_WORLD')}
                  className="bg-gray-700 hover:bg-gray-600 text-white p-3 border-2 border-gray-400 font-bold"
              >
                  Cancel
              </button>
          </div>
      </div>
  );

  const renderOptions = () => (
      <div className="flex flex-col gap-4 w-80 bg-gray-800/90 border-4 border-gray-500 p-6 shadow-2xl">
         <h1 className="text-4xl font-bold text-white mb-4 text-center">{t.OPTIONS}</h1>
         
         <button 
            onClick={() => setLang(lang === 'EN' ? 'PT' : 'EN')}
            className="bg-gray-700 hover:bg-gray-600 text-white p-3 border-2 border-gray-400 font-mono text-lg flex justify-between px-6"
         >
            <span>{t.LANGUAGE}</span>
            <span className="text-yellow-400">{lang}</span>
         </button>

         <button 
            onClick={() => setShowCoordinates(!showCoordinates)}
            className="bg-gray-700 hover:bg-gray-600 text-white p-3 border-2 border-gray-400 font-mono text-lg flex justify-between px-6"
         >
            <span>{t.COORDS}</span>
            <span className={showCoordinates ? "text-green-400" : "text-red-400"}>{showCoordinates ? "ON" : "OFF"}</span>
         </button>

         <button 
            onClick={() => setIsMobile(!isMobile)}
            className="bg-gray-700 hover:bg-gray-600 text-white p-3 border-2 border-gray-400 font-mono text-lg flex justify-between px-6"
         >
            <span>Mobile Mode</span>
            <span className={isMobile ? "text-green-400" : "text-red-400"}>{isMobile ? "ON" : "OFF"}</span>
         </button>

         <button 
            onClick={() => {
                if (adminMode) setAdminMode(false);
                else setShowAdminConfirm(true);
            }}
            className="bg-gray-700 hover:bg-gray-600 text-white p-3 border-2 border-gray-400 font-mono text-lg flex justify-between px-6"
         >
            <span>{t.ADMIN_TEST}</span>
            <span className={adminMode ? "text-green-400" : "text-red-400"}>{adminMode ? "ON" : "OFF"}</span>
         </button>
         
         <button 
            onClick={() => setMenuState('MAIN')}
            className="bg-gray-700 hover:bg-red-600 text-white p-3 border-2 border-gray-400 font-mono text-lg mt-4"
         >
            {t.BACK}
         </button>
      </div>
  );

  return (
    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-50 overflow-hidden">
        {menuState === 'MAIN' && (
             <>
                <h1 className="text-6xl font-bold text-white mb-8 drop-shadow-lg tracking-widest">MINEREACT 2D</h1>
                {renderMain()}
                <div className="mt-8 text-gray-500 text-sm font-mono">Java 1.8 Style • Procedural</div>
             </>
        )}
        {menuState === 'SELECT_WORLD' && renderSelectWorld()}
        {menuState === 'CREATE_WORLD' && renderCreateWorld()}
        {menuState === 'OPTIONS' && renderOptions()}
        
        {/* MULTIPLAYER MENUS */}
        {menuState === 'ONLINE_LOBBY' && renderOnlineLobby()}
        {menuState === 'CREATE_ROOM' && renderCreateRoom()}
        {menuState === 'JOIN_ROOM' && renderJoinRoom()}

        {showAdminConfirm && (
            <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-50">
                <div className="bg-red-900 border-4 border-red-500 p-6 w-[400px] text-white shadow-2xl">
                    <h2 className="text-2xl font-bold text-center mb-4">{t.ADMIN_CONFIRM_TITLE}</h2>
                    <p className="text-center mb-6">{t.ADMIN_CONFIRM_MSG}</p>
                    <div className="flex justify-around">
                        <button 
                            onClick={() => { setAdminMode(true); setShowAdminConfirm(false); }}
                            className="bg-green-700 px-6 py-2 border hover:bg-green-600"
                        >
                            {t.YES}
                        </button>
                        <button 
                            onClick={() => setShowAdminConfirm(false)}
                            className="bg-gray-700 px-6 py-2 border hover:bg-gray-600"
                        >
                            {t.NO}
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
