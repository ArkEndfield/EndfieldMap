<template>
  <div
    class="fixed z-[999999] bottom-4 right-4 bg-black/30 backdrop-blur-2xl text-white py-2 px-2 rounded-full space-x-2"
  >
    <button @click="connect">连线</button>
    <button @click="deleteLine">删除连线</button>
    <button @click="deleteAllLines">删除所有连线</button>
  </div>
</template>

<script setup lang="ts">
import {
  connectPoints,
  removeAllLines,
  removeLineGroup,
} from '@/services/lineConnector';

let times = 0;
const lines: string[] = [];
const connect = () => {
  let id: string = '';
  if (times === 0) {
    id = connectPoints([3500160000, 3500031159]);
    times++;
    lines.push(id);
  } else if (times === 1) {
    id = connectPoints([3500030779, 3500030727, 3500030709]);
    times++;
    lines.push(id);
  }
};

const deleteLine = () => {
  if (lines.length > 0) {
    const id = lines.pop();
    if (id) {
      removeLineGroup(id);
      times--;
    }
  }
};

const deleteAllLines = () => {
  removeAllLines();
  lines.length = 0;
  times = 0;
};
</script>

<style lang="scss" scoped>
button {
  background-color: #000;
  color: #fff;
  border: none;
  padding: 10px 20px;
  border-radius: 99999px;
  cursor: pointer;
}
</style>
