import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { DroneState } from '../engine/types';
import { colors } from '../theme';

interface Props {
  droneState: DroneState;
  cellSize: number;
  crashed: boolean;
}

/** Direction → cumulative rotation degrees (drone points up at 0). */
const DIR_DEG: Record<number, number> = {
  0: 0,
  1: 90,
  2: 180,
  3: 270,
};

export default function DroneSprite({ droneState, cellSize, crashed }: Props) {
  const translateX = useRef(new Animated.Value(droneState.x * cellSize)).current;
  const translateY = useRef(new Animated.Value(droneState.y * cellSize)).current;
  // Rotation stored as a plain number so we can accumulate across turns
  const currentRotRef = useRef(DIR_DEG[droneState.dir]);
  const rotAnim = useRef(new Animated.Value(currentRotRef.current)).current;

  const prevDirRef = useRef(droneState.dir);
  const prevXRef = useRef(droneState.x);
  const prevYRef = useRef(droneState.y);

  useEffect(() => {
    const anims: Animated.CompositeAnimation[] = [];

    // Rotation: accumulate to avoid wrap-around jump
    if (droneState.dir !== prevDirRef.current) {
      const target = DIR_DEG[droneState.dir];
      let delta = target - (currentRotRef.current % 360);
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;
      currentRotRef.current += delta;
      anims.push(
        Animated.timing(rotAnim, {
          toValue: currentRotRef.current,
          duration: 220,
          useNativeDriver: true,
        }),
      );
      prevDirRef.current = droneState.dir;
    }

    // Position
    if (droneState.x !== prevXRef.current || droneState.y !== prevYRef.current) {
      anims.push(
        Animated.timing(translateX, {
          toValue: droneState.x * cellSize,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: droneState.y * cellSize,
          duration: 280,
          useNativeDriver: true,
        }),
      );
      prevXRef.current = droneState.x;
      prevYRef.current = droneState.y;
    }

    if (anims.length > 0) {
      Animated.parallel(anims).start();
    }
  }, [droneState, cellSize, rotAnim, translateX, translateY]);

  const rotDeg = rotAnim.interpolate({
    inputRange: [-720, 720],
    outputRange: ['-720deg', '720deg'],
  });

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          width: cellSize,
          height: cellSize,
          transform: [{ translateX }, { translateY }],
        },
      ]}
      pointerEvents="none"
    >
      <Animated.View
        style={[styles.inner, { transform: [{ rotate: rotDeg }] }]}
      >
        <View style={[styles.droneBody, crashed && styles.crashed]}>
          <View
            style={[
              styles.arrow,
              { borderBottomColor: crashed ? colors.danger : colors.accent },
            ]}
          />
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const ARROW_SIZE = 18;

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  inner: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  droneBody: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  crashed: {
    opacity: 0.8,
  },
  // CSS border trick: a transparent-sided right triangle pointing up
  arrow: {
    width: 0,
    height: 0,
    borderLeftWidth: ARROW_SIZE / 2,
    borderRightWidth: ARROW_SIZE / 2,
    borderBottomWidth: ARROW_SIZE,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: colors.accent,
  },
});
