import { collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, serverTimestamp, query, where } from 'firebase/firestore';
import { GoogleAuthProvider, signInWithPopup, User, browserPopupRedirectResolver } from 'firebase/auth';
import { db, auth } from './firebase';

export interface YoutubeChannel {
  id: string;
  userId: string;
  name: string;
  description?: string;
  tags?: string[];
  profileImageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Token management following workspace-integration skill
let cachedAccessToken: string | null = null;
let loginPromise: Promise<string> | null = null;

const YOUTUBE_SCOPES = [
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube.readonly'
];

// Garante que o usuário está logado antes de qualquer operação
// Se silent for true, não dispara popup e retorna null se não houver token
const ensureLogin = async (silent: boolean = false): Promise<string | null> => {
  if (auth.currentUser && cachedAccessToken) return cachedAccessToken;
  
  if (loginPromise) return loginPromise;

  if (silent) {
    // Se estivermos em modo silencioso, apenas verificamos se o Firebase já tem o usuário
    // mas sem o accessToken do Google (que não é persistido pelo Firebase Auth SDK da mesma forma)
    // não podemos fazer muito. Retornamos null para que a UI saiba que precisa de login.
    return cachedAccessToken;
  }

  loginPromise = (async () => {
    const provider = new GoogleAuthProvider();
    YOUTUBE_SCOPES.forEach(scope => provider.addScope(scope));
    
    try {
      const result = await signInWithPopup(auth, provider, browserPopupRedirectResolver);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (!credential?.accessToken) {
        throw new Error('Failed to get access token from Google');
      }
      cachedAccessToken = credential.accessToken;
      return cachedAccessToken;
    } catch (error: any) {
      console.error('Authentication Error:', error);
      throw new Error('Falha na autenticação via Google: ' + error.message);
    } finally {
      loginPromise = null;
    }
  })();

  return loginPromise;
};

export const youtubeChannelService = {
  async hasToken(): Promise<boolean> {
    return !!cachedAccessToken;
  },

  async login(): Promise<string> {
    return (await ensureLogin(false)) || "";
  },

  async getChannels(): Promise<YoutubeChannel[]> {
    // Tentativa silenciosa primeiro para não bloquear popup
    const token = await ensureLogin(true);
    if (!token || !auth.currentUser) return [];
    
    // Test if user doc exists, create if not
    const userDocRef = doc(db, 'users', auth.currentUser.uid);
    try {
      const userSnap = await getDoc(userDocRef);
      if (!userSnap.exists()) {
        await setDoc(userDocRef, {
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `users/${auth.currentUser.uid}`);
    }

    const pathForGetDocs = `users/${auth.currentUser.uid}/youtubeChannels`;
    const channelsRef = collection(db, pathForGetDocs);
    const q = query(channelsRef, where('userId', '==', auth.currentUser.uid));
    
    try {
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as YoutubeChannel;
      });
    } catch (error) {
       handleFirestoreError(error, OperationType.LIST, pathForGetDocs);
       return [];
    }
  },

  async addChannel(data: Partial<YoutubeChannel>): Promise<void> {
    const token = await ensureLogin(false);
    if (!token || !auth.currentUser) throw new Error("Not authenticated");
    const id = `ch_${Date.now()}`;
    const pathForWrite = `users/${auth.currentUser.uid}/youtubeChannels`;
    
    try {
      await setDoc(doc(db, pathForWrite, id), {
        userId: auth.currentUser.uid,
        name: data.name || "Novo Canal",
        description: data.description || "",
        tags: data.tags || [],
        profileImageUrl: data.profileImageUrl || "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
       handleFirestoreError(error, OperationType.WRITE, `${pathForWrite}/${id}`);
    }
  },

  async updateChannel(id: string, data: Partial<YoutubeChannel>): Promise<void> {
     const token = await ensureLogin(false);
     if (!token || !auth.currentUser) throw new Error("Not authenticated");
     const pathForWrite = `users/${auth.currentUser.uid}/youtubeChannels`;

     try {
       const channelRef = doc(db, pathForWrite, id);
       await updateDoc(channelRef, {
         ...data,
         updatedAt: serverTimestamp()
       });
     } catch (error) {
       handleFirestoreError(error, OperationType.UPDATE, `${pathForWrite}/${id}`);
     }
  },
  
  async deleteChannel(id: string): Promise<void> {
    const token = await ensureLogin(false);
    if (!token || !auth.currentUser) throw new Error("Not authenticated");
    const pathForDelete = `users/${auth.currentUser.uid}/youtubeChannels`;
    
    try {
      const channelRef = doc(db, pathForDelete, id);
      await deleteDoc(channelRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${pathForDelete}/${id}`);
    }
  },

  async uploadVideo(
    blob: Blob, 
    metadata: { title: string; description: string; tags: string[]; categoryId: string; privacyStatus: string },
    onProgress?: (progress: { loaded: number; total: number }) => void
  ): Promise<string> {
    const token = await ensureLogin(false);
    if (!token) throw new Error("Authentication failed: No access token available.");
    
    console.log(`[YOUTUBE_SERVICE] Iniciando upload resiliente: ${metadata.title} (${(blob.size / 1024 / 1024).toFixed(2)} MB)`);

    try {
      // 1. INICIALIZAÇÃO DO UPLOAD RESUMABLE
      const initResponse = await fetch(
        'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'X-Upload-Content-Length': blob.size.toString(),
            'X-Upload-Content-Type': blob.type
          },
          body: JSON.stringify({
            snippet: {
              title: metadata.title.substring(0, 100),
              description: metadata.description,
              tags: metadata.tags,
              categoryId: metadata.categoryId || '22',
            },
            status: {
              privacyStatus: metadata.privacyStatus || 'private',
              selfDeclaredMadeForKids: false,
            },
          })
        }
      );

      if (!initResponse.ok) {
        const error = await initResponse.json().catch(() => ({}));
        throw new Error(`Falha na inicialização do upload: ${error.error?.message || initResponse.statusText}`);
      }

      const uploadUrl = initResponse.headers.get('Location');
      if (!uploadUrl) throw new Error("Não foi possível obter a URL de upload da sessão do YouTube.");

      // 2. TRANSMISSÃO DO CONTEÚDO BINÁRIO COM RASTREAMENTO DE PROGRESSO
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', blob.type);

        if (onProgress) {
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              onProgress({
                loaded: event.loaded,
                total: event.total
              });
            }
          };
        }

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const result = JSON.parse(xhr.responseText);
              console.log(`[YOUTUBE_SERVICE] Vídeo enviado com sucesso. ID: ${result.id}`);
              resolve(result.id);
            } catch (e) {
              reject(new Error("Falha ao processar resposta do YouTube."));
            }
          } else {
            try {
              const error = JSON.parse(xhr.responseText);
              reject(new Error(`Falha na transferência do vídeo: ${error.error?.message || xhr.statusText}`));
            } catch (e) {
              reject(new Error(`Falha na transferência do vídeo: ${xhr.statusText}`));
            }
          }
        };

        xhr.onerror = () => reject(new Error("Erro de rede durante o upload do vídeo."));
        xhr.onabort = () => reject(new Error("Upload cancelado pelo usuário."));

        xhr.send(blob);
      });

    } catch (error: any) {
      console.error('[YOUTUBE_SERVICE] Erro crítico no upload do vídeo:', error);
      throw new Error(`Erro no motor de upload do YouTube: ${error.message}`);
    }
  },

  async setThumbnail(videoId: string, thumbnailBlob: Blob): Promise<void> {
    const token = await ensureLogin(false);
    if (!token) throw new Error("Authentication failed: No access token available.");

    console.log(`[YOUTUBE_SERVICE] Configurando thumbnail para o vídeo: ${videoId}`);

    try {
      const response = await fetch(
        `https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId=${videoId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': thumbnailBlob.type,
          },
          body: thumbnailBlob,
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(`Falha no upload da thumbnail: ${error.error?.message || response.statusText}`);
      }
      
      console.log(`[YOUTUBE_SERVICE] Thumbnail aplicada com sucesso.`);
    } catch (error: any) {
      console.error('[YOUTUBE_SERVICE] Erro no upload da thumbnail:', error);
      throw new Error(`Erro ao configurar thumbnail do YouTube: ${error.message}`);
    }
  }
}
