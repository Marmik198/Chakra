import {createClient} from '@supabase/supabase-js';
import {Capacitor} from '@capacitor/core';
import {secureStorage} from './secure';
import {wrapClient} from './dbproxy';
const native=typeof window!=='undefined'&&Capacitor.isNativePlatform();
// On the phone the login session is kept in the Android Keystore, not in plain storage.
const raw=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,native?{auth:{storage:secureStorage,persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}}:undefined);
export const supabase=wrapClient(raw);
