'use client';
import {Typography,Stack,Box} from '@mui/material';
import Metrics from '@/components/Metrics';
export default function Health(){return <Stack spacing={3}><Box><Typography variant="h4">Health</Typography><Typography color="text.secondary">Checkup numbers with normal ranges. Care routines live in Tasks.</Typography></Box>
 <Metrics tabId="health" section="health" defaults={[['Resting heart rate','bpm',60,100],['Fasting sugar','mg/dL',70,100],['Sleep','hrs',7,9],['Vitamin D','ng/mL',30,100]]}/></Stack>}
