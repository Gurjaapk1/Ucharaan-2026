import { rewardById } from './wardrobe';
import { createContext, useContext } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { bold } from './theme';
import { characters, collection } from './content';
import { s } from './styles';
const UIContext = createContext(null);
export const UIProvider = UIContext.Provider;
export function useUI() { const value = useContext(UIContext); if (!value)
    throw new Error('Shared controls require UIProvider'); return value; }
export function Copy({ children, style }) {
    const { t } = useUI();
    return <Text style={[s.text, { color: t.text }, style]}>{children}</Text>;
}
export function Small({ children }) { const { t } = useUI(); return <Copy style={[s.small, { color: t.secondary }]}>{children}</Copy>; }
export function Heading({ children }) { return <Copy style={s.heading}>{children}</Copy>; }
export function Button({ children, onPress, secondary = false, disabled = false, label }) {
    const { t } = useUI();
    return <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled} accessibilityState={{ disabled }} onPress={onPress} style={({ pressed }) => [s.button, { backgroundColor: secondary ? t.action : t.primary, opacity: disabled ? .4 : pressed ? .78 : 1 }]}><Copy style={{ fontFamily: bold, color: secondary ? t.text : '#faf9f6', textAlign: 'center' }}>{children}</Copy></Pressable>;
}
export function Stars({ count, large = false }) {
    return <View accessible accessibilityLabel={`${count} of 3 stars`} style={s.stars}>{[1, 2, 3].map(n => <Text key={n} style={{ fontSize: large ? 38 : 17, lineHeight: large ? 44 : 22, color: n <= count ? '#cba51e' : '#a1a9b2' }}>★</Text>)}</View>;
}
export function Avatar({ who, frame, small = false }) {
    const { t, host, character, equipped, wardrobe } = useUI();
    who = who ?? character;
    frame = frame ?? equipped;
    return <View style={[s.avatar, { width: small ? 62 : 123, height: small ? 78 : 160, borderColor: collection.find(r => r.id === frame)?.color ?? '#c4d4ea', backgroundColor: t.action }]}><Image source={host.image(`${who}-${wardrobe.equipped.clothing === 'garden-thread' ? 'garden' : 'character'}.png`)} accessibilityLabel={characters.find(c => c.id === who)?.name} resizeMode="contain" style={s.fill}/>{wardrobe.equipped.belonging !== 'travel-light' && <View style={{ position: 'absolute', right: 0, bottom: 0, padding: 4, borderRadius: 8, backgroundColor: t.surface }}><host.Icon name={rewardById(wardrobe.equipped.belonging)?.icon ?? 'satchel'} color={t.text} size={small ? 16 : 24}/></View>}</View>;
}
export function Row({ title, subtitle, onPress, icon, trailing, expanded }) {
    const { t, host: { Icon } } = useUI();
    const inner = <><View style={s.rowBody}>{icon && <View style={s.rowIcon}><Icon name={icon} color={t.text} size={25}/></View>}<View style={s.grow}><Copy style={{ fontSize: 18 }}>{title}</Copy>{subtitle && <Small>{subtitle}</Small>}</View>{trailing ?? (onPress && <Copy style={{ color: t.secondary, fontSize: 24 }}>›</Copy>)}</View></>;
    return onPress ? <Pressable accessibilityRole="button" accessibilityState={expanded === undefined ? undefined : { expanded }} onPress={onPress} style={({ pressed }) => [s.row, { borderColor: t.separator, backgroundColor: pressed ? t.action : t.surface }]}>{inner}</Pressable> : <View style={[s.row, { borderColor: t.separator }]}>{inner}</View>;
}
export function Section({ children }) { const { t } = useUI(); return <View style={[s.section, { backgroundColor: t.subtle, borderColor: t.separator }]}><Small>{children}</Small></View>; }
