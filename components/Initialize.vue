<template>
  <h1>Subsonic Server</h1>
  <div class="fields-container">
    <span class="field-item" v-for="item in fields" >
     <s-icon><ms-icon :name="item.icon"></ms-icon></s-icon>
    <s-text-field :label="item.label" :type="item.type" :showPasswordToggle="item.isPasswordToggleShowed"></s-text-field>
    </span>
  </div>
</template>

<script lang="ts" setup>
import 'ms-icon/dns'
import 'ms-icon/person'
import 'ms-icon/password'

type password = 'password';

const fields = [
  {
    icon:"dns",
    label:"Server IP"
  },
  {
    icon:"person",
    label:"Username"
  },
  {
    icon:"password",
    label:"Password",
    type:"password" as password,
    isPasswordToggleShowed:"true" as any
  }
]
</script>

<style scoped>
h1 {
  position: absolute;
  font-size: 1.3rem;
  margin-top: 20px;
}

.fields-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 80px;
  width: 85%;
}

s-text-field {
  width: 100%;
  height: auto;
  margin-top: 0;
}

.field-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

s-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
</style>
