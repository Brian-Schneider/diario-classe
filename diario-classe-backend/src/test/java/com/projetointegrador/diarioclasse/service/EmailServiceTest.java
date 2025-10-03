package com.projetointegrador.diarioclasse.service;

import com.icegreen.greenmail.configuration.GreenMailConfiguration;
import com.icegreen.greenmail.junit5.GreenMailExtension;
import com.icegreen.greenmail.util.ServerSetupTest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.RegisterExtension;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

import jakarta.mail.internet.MimeMessage;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
public class EmailServiceTest {

    @RegisterExtension
    static GreenMailExtension greenMail = new GreenMailExtension(ServerSetupTest.SMTP)
            .withConfiguration(GreenMailConfiguration.aConfig().withUser("test", "test"));

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