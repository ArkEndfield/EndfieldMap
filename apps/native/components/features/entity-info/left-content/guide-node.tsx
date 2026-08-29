import type { GuideImageNode, GuideNodeType, GuideTextNode } from '@endfieldmap/map-service';
import React from 'react';
import type { TextStyle } from 'react-native';
import { Image, Pressable, Text } from 'react-native';

function TextNode({ node }: { node: GuideTextNode }) {
  return (
    <Text
      style={{
        color: node.color ?? '#ccc',
        fontSize: node.fontSize ?? 14,
        fontWeight: node.fontWeight ? (`${node.fontWeight}` as TextStyle['fontWeight']) : undefined,
        fontFamily: node.fontFamily,
      }}
    >
      {node.text}
    </Text>
  );
}

function ImageNode({ node, onPress }: { node: GuideImageNode; onPress?: () => void }) {
  const isBase64 = node.src.startsWith('data:image');
  const uri = isBase64 ? node.src : `/images/guides/e0m2_3_flashback_008.png`;

  return (
    <Pressable onPress={onPress} className="my-2 self-center">
      <Image
        source={{ uri }}
        className="h-32 w-full rounded-lg"
        resizeMode="contain"
        accessibilityLabel="guide image"
      />
    </Pressable>
  );
}

interface GuideNodeProps {
  node: GuideNodeType;
  onImagePress?: (index: number) => void;
  imageIndexMap?: Map<GuideNodeType, number>;
}

export function GuideNode({ node, onImagePress, imageIndexMap }: GuideNodeProps) {
  if (node.type === 'text') return <TextNode node={node} />;

  if (node.type === 'image') {
    const imageIndex = imageIndexMap?.get(node) ?? 0;
    return <ImageNode node={node} onPress={() => onImagePress?.(imageIndex)} />;
  }

  return (
    <>
      {node.nodes.map((childNode, index) => (
        <GuideNode key={index} node={childNode} onImagePress={onImagePress} imageIndexMap={imageIndexMap} />
      ))}
    </>
  );
}
