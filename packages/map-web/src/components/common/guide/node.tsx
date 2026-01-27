import type { GuideImageNode, GuideNodeType, GuideTextNode } from '@eftypes/guide';

const TextNode = ({ node }: { node: GuideTextNode }) => (
  <span
    style={{
      color: node.color,
      fontSize: node.fontSize,
      fontWeight: node.fontWeight,
      fontFamily: node.fontFamily,
    }}
  >
    {node.text}
  </span>
);

const ImageNode = ({ node, onClick }: { node: GuideImageNode; onClick?: () => void }) => {
  const isBase64 = node.src.startsWith('data:image');
  return (
    <img
      src={isBase64 ? node.src : `/images/guides/e0m2_3_flashback_008.png`}
      alt={node.type}
      className="max-w-full h-auto max-h-32 rounded-lg place-self-center cursor-pointer hover:opacity-80 transition-opacity"
      onClick={onClick}
    />
  );
};

export const GuideNode = ({
  node,
  onImageClick,
  imageIndexMap,
}: {
  node: GuideNodeType;
  onImageClick?: (index: number) => void;
  imageIndexMap?: Map<GuideNodeType, number>;
}) => {
  if (node.type === 'text') return <TextNode node={node} />;

  if (node.type === 'image') {
    const imageIndex = imageIndexMap?.get(node) ?? 0;
    return <ImageNode node={node} onClick={() => onImageClick?.(imageIndex)} />;
  }

  return node.nodes.map((childNode, index) => (
    <GuideNode key={index} node={childNode} onImageClick={onImageClick} imageIndexMap={imageIndexMap} />
  ));
};
