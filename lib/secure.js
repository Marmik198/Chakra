const S='app.chakra.';
export const secureStorage={
 async getItem(k){try{const{NativeBiometric}=await import('@capgo/capacitor-native-biometric');const c=await NativeBiometric.getCredentials({server:S+k});return c.password}catch{return null}},
 async setItem(k,v){const{NativeBiometric}=await import('@capgo/capacitor-native-biometric');await NativeBiometric.setCredentials({username:k,password:v,server:S+k})},
 async removeItem(k){try{const{NativeBiometric}=await import('@capgo/capacitor-native-biometric');await NativeBiometric.deleteCredentials({server:S+k})}catch{}}};
