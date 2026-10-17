import React from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useSelector } from "react-redux";
import PropTypes from "prop-types";
import useTheme from "@common/context";
import useThemedStyles from "@common/hooks/useThemedStyles";
import { STRINGS, CustomText, SafeArea, StatusBarComponent } from "@common";
import Stars from "../components/Stars";
import { isPauriReady, PAURI_COUNT, REGIONS } from "../data/japji";
import useKidsHeader from "../hooks/useKidsHeader";
import { bestStars, totalCoins, totalStars } from "../state/progress";
import createStyles from "./styles";

const JourneyScreen = ({ navigation }) => {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const header = useKidsHeader(navigation, STRINGS.KIDS_JAPJI_SAHIB);
  const progress = useSelector((state) => state.kidsMode?.progress);

  const renderNode = (pauri) => {
    const ready = isPauriReady(pauri);
    const stars = bestStars(progress, pauri);
    const status = ready ? `${stars} ${STRINGS.KIDS_OF_THREE_STARS}` : STRINGS.KIDS_COMING_SOON;
    return (
      <Pressable
        key={pauri}
        accessibilityRole="button"
        accessibilityLabel={`${STRINGS.KIDS_PAURI} ${pauri}, ${status}`}
        accessibilityState={{ disabled: !ready }}
        disabled={!ready}
        onPress={() => navigation.navigate("KidsPractice", { pauri })}
        style={[styles.node, !ready && styles.nodeLocked]}
      >
        <View style={[styles.nodeDisc, stars > 0 && styles.nodeDone]}>
          <CustomText style={[styles.nodeText, stars > 0 && styles.nodeTextDone]}>{pauri}</CustomText>
        </View>
        {ready ? (
          <Stars count={stars} />
        ) : (
          <CustomText style={styles.small}>{STRINGS.KIDS_COMING_SOON}</CustomText>
        )}
      </Pressable>
    );
  };

  return (
    <SafeArea backgroundColor={theme.colors.surface}>
      <StatusBarComponent backgroundColor={theme.colors.surface} />
      {header}
      <ScrollView>
        <View style={styles.pad}>
          <CustomText style={styles.heading}>{STRINGS.KIDS_JOURNEY_HEADING}</CustomText>
          <CustomText style={styles.body}>
            {`★ ${totalStars(progress)}/${PAURI_COUNT * 3} · ${totalCoins(progress)} ${
              STRINGS.KIDS_COINS
            }`}
          </CustomText>
        </View>
        {REGIONS.map((region) => (
          <View key={region.name}>
            <View style={styles.section}>
              <CustomText style={styles.small}>
                {`${STRINGS.KIDS_PAURIS} ${region.start}–${region.end}`}
              </CustomText>
              <CustomText style={styles.sectionTitle}>{region.name}</CustomText>
            </View>
            <View style={styles.nodes}>
              {Array.from({ length: region.end - region.start + 1 }, (_, i) =>
                renderNode(region.start + i)
              )}
            </View>
          </View>
        ))}
        <View style={styles.pad}>
          <CustomText style={styles.small}>{STRINGS.KIDS_COINS_RULE}</CustomText>
        </View>
      </ScrollView>
    </SafeArea>
  );
};

JourneyScreen.propTypes = {
  navigation: PropTypes.shape({ navigate: PropTypes.func, setOptions: PropTypes.func }).isRequired,
};

export default JourneyScreen;
