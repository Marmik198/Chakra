'use client';
import {Box,Typography} from '@mui/material';
// A tidy form layout. Fields sit on a responsive grid so they line up and never get squeezed:
// <FormGrid><TextField .../><Wide><TextField fullWidth .../></Wide></FormGrid>
// Wide takes a full row. Field puts a small label above something that has none of its own (a toggle, a rating, a colour).
export default function FormGrid({children,min=200,sx}){return <Box sx={{display:'grid',gap:2,gridTemplateColumns:`repeat(auto-fit,minmax(min(100%,${min}px),1fr))`,alignItems:'start',...sx}}>{children}</Box>}
export const Wide=({children,sx})=><Box sx={{gridColumn:'1 / -1',minWidth:0,...sx}}>{children}</Box>;
export const Field=({label,children,sx})=><Box sx={{minWidth:0,...sx}}><Typography variant="caption" color="text.secondary" sx={{display:'block',mb:.75}}>{label}</Typography>{children}</Box>;
