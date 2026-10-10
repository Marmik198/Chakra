import Section from './Section';
export const dynamicParams=false;
export function generateStaticParams(){return ['journal','leisure','outings','goals'].map(section=>({section}))}
export default function Page(){return <Section/>}
