package com.projetointegrador.diarioclasse.service;

import com.icegreen.greenmail.configuration.GreenMailConfiguration;
import com.icegreen.greenmail.junit5.GreenMailExtension;
import com.icegreen.greenmail.util.ServerSetupTest;
import com.icegreen.greenmail.util.GreenMailUtil;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.RegisterExtension;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.DynamicPropertyRegistry;


import jakarta.mail.internet.MimeMessage;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
public class EmailServiceTest {


    @RegisterExtension
    static GreenMailExtension greenMail = new GreenMailExtension(ServerSetupTest.SMTP)
            .withConfiguration(GreenMailConfiguration.aConfig().withDisabledAuthentication())
            .withPerMethodLifecycle(false);


                    // Injeta o host e porta reais do GreenMail na config do Spring Mail
    @DynamicPropertySource
    static void mailProps(DynamicPropertyRegistry r) {
        r.add("spring.mail.host", () -> "localhost");
        r.add("spring.mail.port", () -> greenMail.getSmtp().getPort());
        r.add("spring.mail.protocol", () -> "smtp");
        r.add("spring.mail.username", () -> "admin@admin.com");
        r.add("spring.mail.password", () -> "Admin123");
        r.add("spring.mail.properties.mail.smtp.auth", () -> "false");
        r.add("spring.mail.properties.mail.smtp.starttls.enable", () -> "false"); // SMTP simples
        r.add("spring.mail.properties.mail.debug", () -> "true");
    }

    @Autowired
    private JavaMailSender mailSender;

    @Test
    void testEnviarEmailSimples() throws Exception {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom("remetente@email.com");
        message.setTo("destinatario@email.com");
        message.setSubject("📩 Teste de e-mail");
        message.setText("Olá! Este é um teste simples de envio de e-mail via Spring Boot.");

        mailSender.send(message);

        assertTrue(greenMail.waitForIncomingEmail(15_000, 1));
        MimeMessage[] receivedMessages = greenMail.getReceivedMessages();
        assertEquals(1, receivedMessages.length);
        assertEquals("📩 Teste de e-mail", receivedMessages[0].getSubject());
        assertTrue(GreenMailUtil.getBody(receivedMessages[0]).contains("Olá!"));
    }
}

/*
package com.projetointegrador.diarioclasse.service;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

@SpringBootTest
public class EmailServiceTest {

    @Autowired
    private JavaMailSender mailSender;

    @Test
    void testEnviarEmailSimples() {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo("destinatario@email.com");
        message.setSubject("📩 Teste de e-mail");
        message.setText("Olá! Este é um teste simples de envio de e-mail via Spring Boot.");

        mailSender.send(message);
        System.out.println("✅ E-mail simples enviado com sucesso!");
    }
}
*/