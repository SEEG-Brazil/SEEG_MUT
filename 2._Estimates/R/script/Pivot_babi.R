# Read data (tratei os dados apenas simplificando o nome das variáveis)
# Gerei outro df
# Ler os dados
df <- read.csv("C:/Users/edriano.souza/GitHub/2023_SEEG_c11/1_Babi/dfTRAT.csv",
               h=T, encoding = "UTF-8") #'UTF-8' - Ele não lê correto, pois a .csv tem coluna com barra '/'....


# Biblioteca
library(dplyr)
library(tidyr)


#Inicio
df2<- df #Create copy
df2 <- df2 %>%
  mutate_at(vars(names(df2)[15:67]), as.numeric) #Harmonizar formatos do df

# Colunas desejaveis
id_vars <- df2[, 1:14]

# Colunas para redimensionar
value_vars <- colnames(df2)[15:67]

# Utilizar pivot para remapear e rotacionar dados
df2_long <- df2 %>%
  pivot_longer(cols = all_of(value_vars), names_to = "Ano", values_to = "Valor")
# Operação concluída
print("Operação concluída.")


#Copy (Apenas para segurança)
df_OK<- df2_long
data_ok <- as.data.frame(df2_long)


#Apos o pivot os dados contem X(Ano)
# Aplicar para retirada do X
data_ok <- data_ok %>%
  mutate(Ano = sub("^X", "", Ano))

#Nomes desejáveis das colunas
newNames <- c("Setor de emissão","Categoria emissora","Sub-categoria emissora","Produto ou sistema","Detalhamento",
               "Recorte","Atividade geral","Id território","País","Estado",
               "Município","Bioma","Emissão_Remoção_Bunker","Gás", "Ano", "Valor")
names(data_ok) <- newNames # Receber newNames

# Imprimir .csv
write.csv(data_ok, file = "C:/Users/edriano.souza/GitHub/2023_SEEG_c11/1_Babi/Tabelao_Mut_Long_04_10.csv", row.names=F)
