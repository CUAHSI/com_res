<template>
  <h2 class="ma-2 text-center">About</h2>
  <v-container class="about">
    <v-sheet class="pa-6 mx-auto ma-4" max-width="1200" rounded>
      <p>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas ultricies leo in nunc
        tempor, vitae consectetur nibh interdum. Pellentesque porta sed velit quis congue. Nam quis
        dignissim lacus. Integer urna erat, ullamcorper sit amet aliquet vel, convallis nec turpis.
        In diam massa, imperdiet id pulvinar eu, pharetra non augue. Integer ac euismod odio.
        Vivamus eros lectus, euismod sed mauris sit amet, tempus molestie nulla. Etiam dictum velit
        ut consequat aliquam. Sed ut feugiat leo. Curabitur tincidunt imperdiet interdum.
        Suspendisse dictum lacus ante, eu ornare eros dignissim eu. Nam malesuada, dolor non aliquam
        molestie, dolor arcu iaculis orci, in faucibus elit urna non urna. Donec sollicitudin
        feugiat metus, nec vehicula odio faucibus vitae. Quisque sed lectus felis.
      </p>
    </v-sheet>
  </v-container>

  <h2 class="ma-2 text-center">Our Team</h2>
  <v-container>
    <v-row align="center" justify="center">
      <v-col v-for="member in members" :key="member.name" cols="auto">
        <v-card>
          <v-img
            :src="`${member.image}`"
            :width="400"
            aspect-ratio="1"
            cover
            lazy-src="https://www.hydroshare.org/static/static/img/home-page/carousel/bg3.jpg"
          >
            <template v-slot:placeholder>
              <div class="d-flex align-center justify-center fill-height">
                <v-progress-circular color="grey-lighten-4" indeterminate></v-progress-circular>
              </div>
            </template>
          </v-img>
          <v-card-title class="text-h6">
            {{ member.name }}
          </v-card-title>
          <v-card-subtitle>
            {{ member.position }}
            <v-divider></v-divider>
            {{ member.org }}
          </v-card-subtitle>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<style>
@media (min-width: 1024px) {
  .about {
    min-height: 50vh;
  }
}
</style>

<script setup>
const members = [
  {
    name: 'Tony Castronova',
    image: 'https://www.cuahsi.org/uploads/team/img/_headshot/TCastronova.jpg',
    position: 'Senior Research Hydrologist',
    org: 'CUAHSI'
  },
  {
    name: 'Devin Cowan',
    image: 'https://www.cuahsi.org/uploads/team/img/_headshot/Devin-Cowan.jpg',
    position: 'Research Programmer',
    org: 'CUAHSI'
  },
  {
    name: 'Irene Garousi-Nejad',
    image: 'https://www.cuahsi.org/uploads/team/img/_headshot/Irene_headshot03.jpg',
    position: 'Research Scientist',
    org: 'CUAHSI'
  }
]
</script>
